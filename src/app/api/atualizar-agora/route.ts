import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchExcelAttachmentsByEmail } from '@/utils/imapClient'
import { analisarItens, AnaliseRow } from '@/utils/analisador'
import { overwriteSheet } from '@/utils/sheetsClient'
import * as XLSX from 'xlsx'

// ── Helpers compartilhados ────────────────────────────────────────────────────

function parseDateExcel(val: any): Date {
    if (!val) return new Date();
    if (typeof val === 'number') {
        return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    if (typeof val === 'string' && val.includes('/')) {
        const parts = val.split(/[\s/:]+/);
        if (parts.length >= 6) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${parts[3]}:${parts[4]}:${parts[5]}Z`);
        if (parts.length >= 5) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${parts[3]}:${parts[4]}:00Z`);
        if (parts.length >= 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
}

function parseValor(val: any): number {
    if (typeof val === 'number') return val;
    if (!val && val !== 0) return 0;
    const s = String(val).trim().replace(/R\$\s?/g, '').replace(/\s/g, '');
    if (s.includes(',') && s.includes('.')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    if (s.includes(',')) return parseFloat(s.replace(',', '.')) || 0;
    return parseFloat(s) || 0;
}

function agregarAnaliseRows(rows: AnaliseRow[]): AnaliseRow[] {
    const m = new Map<string, AnaliseRow>()
    for (const r of rows) {
        const key = `${r.documento}|${r.unidade_origem}|${r.unidade_destino}|${r.ds_produto}`
        if (m.has(key)) {
            const ex = m.get(key)!
            m.set(key, {
                ...ex,
                qt_entrada: (Number(ex.qt_entrada) || 0) + (Number(r.qt_entrada) || 0),
                valor_total: (Number(ex.valor_total) || 0) + (Number(r.valor_total) || 0),
            })
        } else {
            m.set(key, { ...r })
        }
    }
    return Array.from(m.values())
}

function parseAttachmentsFromEmail(attachments: { filename: string; content: Buffer }[]): {
    saida: AnaliseRow[]; entrada: AnaliseRow[]; primeiraData: Date | null
} {
    const saida: AnaliseRow[] = [];
    const entrada: AnaliseRow[] = [];
    let primeiraData: Date | null = null;

    for (const att of attachments) {
        const workbook = XLSX.read(att.content, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        if (jsonData.length === 0) continue;

        const nameLow = att.filename.toLowerCase();
        const isSaida = nameLow.includes('saida') || nameLow.includes('concedido') || nameLow.includes('envio');
        const isEntrada = nameLow.includes('entrada') || nameLow.includes('recebido');

        if (jsonData.length > 0) {
            console.log(`[Excel] ${att.filename} → colunas: ${Object.keys(jsonData[0]).join(', ')}`);
        }

        for (const row of jsonData) {
            let dataPura = row['Data/Hora'] || row['DATA/HORA'] || row['Data'] || row['DATA'] || row['data'];
            const horaPura = row['Hora'] || row['HORA'] || row['hora'] || row['Time'];

            if (horaPura != null && dataPura != null) {
                if (typeof dataPura === 'number' && typeof horaPura === 'number') {
                    dataPura = dataPura + horaPura;
                } else if (typeof dataPura === 'number' && typeof horaPura === 'string') {
                    const hParts = String(horaPura).split(':');
                    if (hParts.length >= 2) {
                        const frac = (parseInt(hParts[0]) * 3600 + parseInt(hParts[1] || '0') * 60 + parseInt(hParts[2] || '0')) / 86400;
                        dataPura = dataPura + frac;
                    }
                } else if (typeof dataPura === 'string' && typeof horaPura === 'string') {
                    if (!dataPura.includes(':')) dataPura = `${dataPura} ${horaPura}`;
                }
            }

            const dataFormatada = parseDateExcel(dataPura);
            if (!primeiraData) primeiraData = dataFormatada;

            const obj: AnaliseRow = {
                data: dataFormatada.toISOString(),
                unidade_origem: String(row['Unidade Origem'] || row['unidade_origem'] || row['Origem'] || ''),
                unidade_destino: String(row['Unidade Destino'] || row['unidade_destino'] || row['Destino'] || ''),
                documento: String(row['Documento'] || row['Nro Doc'] || row['documento'] || ''),
                ds_produto: String(row['Ds Produto'] || row['Produto'] || row['ds_produto'] || ''),
                especie: String(row['Ds Especie'] || row['Especie'] || row['especie'] || ''),
                valor_total: parseValor(row['Total'] || row['Valor Total'] || row['valor_total'] || row['vl_total'] || 0),
                qt_entrada: parseValor(row['Qt Entrada'] || row['Qtd'] || row['Qtd Entrada'] || row['qt_entrada'] || 0)
            };

            if (isSaida && !isEntrada) saida.push(obj);
            else if (isEntrada && !isSaida) entrada.push(obj);
            else saida.push(obj);
        }
    }

    return { saida, entrada, primeiraData };
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        console.log("=== Iniciando Sincronização Nativa Node.js ===")

        const url = new URL(req.url)
        const force = url.searchParams.get('force') === 'true'
        // Parâmetros opcionais para buscar email de data específica (ex: ?since=2026-03-01&before=2026-03-02)
        const sinceParam = url.searchParams.get('since')
        const beforeParam = url.searchParams.get('before')
        const sinceDate = sinceParam ? new Date(sinceParam + 'T00:00:00Z') : undefined
        const beforeDate = beforeParam ? new Date(beforeParam + 'T23:59:59Z') : undefined

        // 1. Fetch Attachments via IMAP — todos os emails na janela, agrupados por email
        let emailGroups: Awaited<ReturnType<typeof fetchExcelAttachmentsByEmail>> = [];
        try {
            console.log(">> Etapa 1: Baixando planilhas de e-mails via IMAP...")
            emailGroups = await fetchExcelAttachmentsByEmail(force, sinceDate, beforeDate);
            if (emailGroups.length === 0) {
                const senderInfo = process.env.GMAIL_SENDER
                    ? `remetente: ${process.env.GMAIL_SENDER}`
                    : 'remetente: qualquer (GMAIL_SENDER não configurada)'
                const subjectInfo = process.env.GMAIL_SUBJECT
                    ? `assunto contém: "${process.env.GMAIL_SUBJECT}"`
                    : 'assunto: qualquer'
                const caixaInfo = `caixa: INBOX de ${process.env.GMAIL_USER || 'carlos.victor@grupohospitalcasa.com.br'}`
                const debug = `[${caixaInfo} | ${senderInfo} | ${subjectInfo}]`
                return NextResponse.json({
                    success: true,
                    message: force
                        ? `Nenhum arquivo Excel encontrado nos últimos 60 dias (modo forçado). ${debug}`
                        : `Nenhum novo email com planilhas encontrado. Use "Reprocessar email lido" para ignorar emails já lidos. ${debug}`,
                    count: 0
                })
            }
            console.log(`✅ ${emailGroups.length} email(s) com anexos Excel encontrado(s).`);
        } catch (e: any) {
            console.error("Erro IMAP:", e);
            return NextResponse.json({ error: "Falha ao conectar no Gmail IMAP: " + e.message }, { status: 500 })
        }

        // 2. Processar cada email separadamente e acumular resultados
        console.log(">> Etapa 2: Processando arquivos Excel por email...")

        const sheetsHeaders = [
            "Data", "Unidade Origem", "Unidade Destino", "Documento",
            "Produto (Saída)", "Produto (Entrada)", "Espécie",
            "Valor Saída (R$)", "Valor Entrada (R$)", "Diferença (R$)",
            "Qtd Saída", "Qtd Entrada", "Diferença Qtd",
            "Data Entrada", "Tempo Recebimento (Horas)",
            "Status", "Tipo de Divergência",
            "Qualidade Match", "Observações", "Detalhes Produto"
        ];

        const sheetsDataComplete: any[][] = [];
        const sheetsDataNC: any[][] = [];
        const sheetsDataC: any[][] = [];
        const supabaseRecords: any[] = [];

        let totalAnalisados = 0;
        const statsAcum = { conformes: 0, nao_conformes: 0, nao_encontrados: 0, valor_divergente: 0, qtd_divergente: 0, matches_perfeitos: 0, matches_bons: 0, matches_razoaveis: 0 };
        let primeiraDataGlobal: Date | null = null;

        for (const group of emailGroups) {
            const { saida, entrada, primeiraData } = parseAttachmentsFromEmail(group.attachments);

            if (saida.length === 0 && entrada.length === 0) {
                console.warn(`[Email UID=${group.emailUid}] Ignorado: nenhum arquivo reconhecido como Saída ou Entrada.`);
                continue;
            }

            if (!primeiraDataGlobal && primeiraData) primeiraDataGlobal = primeiraData;

            // 3. Análise de correspondência por email
            const { analise, stats } = analisarItens(agregarAnaliseRows(saida), agregarAnaliseRows(entrada));
            totalAnalisados += analise.length;

            statsAcum.conformes += stats.conformes;
            statsAcum.nao_conformes += stats.nao_conformes;
            statsAcum.nao_encontrados += stats.nao_encontrados;
            statsAcum.valor_divergente += stats.valor_divergente ?? 0;
            statsAcum.qtd_divergente += stats.qtd_divergente ?? 0;
            statsAcum.matches_perfeitos += stats.matches_perfeitos ?? 0;
            statsAcum.matches_bons += stats.matches_bons ?? 0;
            statsAcum.matches_razoaveis += stats.matches_razoaveis ?? 0;

            for (const item of analise) {
                const dtFormatada = item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '';
                const dtEntradaFormatada = item.data_entrada ? new Date(item.data_entrada).toLocaleDateString('pt-BR') : '';

                const rowArr = [
                    dtFormatada, item.origem || '', item.destino || '', item.doc || '',
                    item.prod_saida || '', item.prod_entrada || '', item.especie || '',
                    item.val_saida || 0, item.val_entrada || 0, item.dif_val || 0,
                    item.qtd_saida || 0, item.qtd_entrada || 0, item.dif_qtd || 0,
                    dtEntradaFormatada, item.tempo_recebimento || 0,
                    item.status || '', item.tipo_div || '', item.qualidade_match || '',
                    item.obs || '', item.detalhes_produto || ''
                ];

                sheetsDataComplete.push(rowArr);
                if (item.status?.includes("Não Conforme")) sheetsDataNC.push(rowArr);
                else if (item.status?.includes("Conforme")) sheetsDataC.push(rowArr);

                supabaseRecords.push({
                    data_transferencia: item.data ? new Date(item.data).toISOString() : null,
                    documento: String(item.doc || ''),
                    unidade_origem: String(item.origem || ''),
                    unidade_destino: String(item.destino || ''),
                    produto_saida: String(item.prod_saida || ''),
                    qtd_saida: Number(item.qtd_saida || 0),
                    produto_entrada: item.prod_entrada ? String(item.prod_entrada) : null,
                    qtd_entrada: Number(item.qtd_entrada || 0),
                    data_recebimento: item.data_entrada ? new Date(item.data_entrada).toISOString() : null,
                    status_item: String(item.status || '').toLowerCase().replace('✅ ', '').replace('❌ ', '').replace('⚠️ ', ''),
                    tempo_recebimento: Number(item.tempo_recebimento || 0),
                    valor_saida: Number(item.val_saida || 0),
                    valor_entrada: item.val_entrada != null && item.val_entrada !== '' ? Number(item.val_entrada) : null,
                    diferenca_financeira: item.dif_val != null && item.dif_val !== '' ? Number(item.dif_val) : null,
                    diferenca_quantidade: item.dif_qtd != null && item.dif_qtd !== '' ? Number(item.dif_qtd) : null,
                    tipo_divergencia: item.tipo_div ? String(item.tipo_div) : null,
                    qualidade_match: item.qualidade_match ? String(item.qualidade_match) : null,
                    especie: item.especie ? String(item.especie) : null,
                    observacoes: item.obs ? String(item.obs) : null,
                });
            }
        }

        if (supabaseRecords.length === 0) {
            return NextResponse.json({ success: true, message: "Pares Saída/Entrada inválidos em todos os emails encontrados.", count: 0 });
        }

        // 4. Update Database
        console.log(">> Etapa 4: Atualizando banco de dados Supabase...")
        {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            // Deduplica pelo business key (último valor vence dentro do mesmo sync)
            const uniqueRecordsMap = new Map<string, any>();
            for (const record of supabaseRecords) {
                const key = `${record.documento}|${record.unidade_origem}|${record.unidade_destino}|${record.produto_saida}`;
                uniqueRecordsMap.set(key, record);
            }
            const uniqueSupabaseRecords = Array.from(uniqueRecordsMap.values());

            // Determina o intervalo de datas coberto pelos registros processados
            const datas = uniqueSupabaseRecords
                .map(r => r.data_transferencia ? new Date(r.data_transferencia) : null)
                .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

            const deleteStart = sinceDate ?? (datas.length > 0
                ? new Date(Date.UTC(Math.min(...datas.map(d => d.getUTCFullYear())), Math.min(...datas.map(d => d.getUTCMonth())), 1))
                : null);
            const deleteEnd = beforeDate ?? (datas.length > 0
                ? new Date(Date.UTC(Math.max(...datas.map(d => d.getUTCFullYear())), Math.max(...datas.map(d => d.getUTCMonth())) + 1, 0, 23, 59, 59, 999))
                : null);

            if (deleteStart && deleteEnd) {
                // Apaga apenas o período coberto pelos dados — preserva outros meses
                const { error: errDel } = await supabaseAdmin
                    .from('itens_clinicos')
                    .delete()
                    .gte('data_transferencia', deleteStart.toISOString())
                    .lte('data_transferencia', deleteEnd.toISOString())
                if (errDel) throw new Error(`Falha ao limpar período: ${errDel.message}`);
                console.log(`Período ${deleteStart.toISOString().split('T')[0]} → ${deleteEnd.toISOString().split('T')[0]} limpo. Inserindo ${uniqueSupabaseRecords.length} registros...`);
            } else {
                console.warn('Não foi possível determinar intervalo de datas — nenhum registro será removido antes da inserção.');
            }

            const BATCH_SIZE = 100;
            for (let i = 0; i < uniqueSupabaseRecords.length; i += BATCH_SIZE) {
                const chunk = uniqueSupabaseRecords.slice(i, i + BATCH_SIZE)
                const { error: errItens } = await supabaseAdmin.from('itens_clinicos').insert(chunk)
                if (errItens) throw new Error(`Falha ao salvar itens_clinicos no Supabase: ${errItens.message}`);
            }

            // Consolidado — usa a primeira data global como referência
            let sumSaida = 0, sumEntrada = 0, sumDivergente = 0, sumPendente = 0;
            for (const record of supabaseRecords) {
                sumSaida += Number(record.valor_saida || 0);
                sumEntrada += Number(record.valor_entrada || 0);
                if (record.status_item?.includes('não conforme')) sumDivergente += Math.abs(Number(record.diferenca_financeira || 0));
                if (record.status_item?.includes('não recebido')) sumPendente += Number(record.valor_saida || 0);
            }

            const dataRef = primeiraDataGlobal ? primeiraDataGlobal.toISOString() : new Date().toISOString();
            const dateKey = dataRef.split('T')[0];
            const { data: existingCons } = await supabaseAdmin
                .from('analises_consolidadas')
                .select('id')
                .gte('data_referencia_arquivos', `${dateKey}T00:00:00.000Z`)
                .lte('data_referencia_arquivos', `${dateKey}T23:59:59.999Z`)
                .maybeSingle();

            const consolidadoPayload = {
                itens_analisados: totalAnalisados,
                itens_conformes: statsAcum.conformes,
                itens_nao_conformes: statsAcum.nao_conformes,
                itens_pendentes: statsAcum.nao_encontrados,
                divergencia_quantidade: statsAcum.qtd_divergente,
                entradas_inferiores: 0,
                total_saida: sumSaida,
                total_entrada: sumEntrada,
                total_pendente: sumPendente,
                total_divergencia: sumDivergente,
                data_referencia_arquivos: dataRef
            };

            let errCons;
            if (existingCons?.id) {
                ({ error: errCons } = await supabaseAdmin.from('analises_consolidadas').update(consolidadoPayload).eq('id', existingCons.id));
                console.log(`✅ analises_consolidadas atualizado para ${dateKey}`);
            } else {
                ({ error: errCons } = await supabaseAdmin.from('analises_consolidadas').insert(consolidadoPayload));
                console.log(`✅ analises_consolidadas inserido para ${dateKey}`);
            }
            if (errCons) throw new Error(`Falha ao salvar analises_consolidadas: ${errCons.message}`);
        }

        // 5. Update Google Sheets
        console.log(">> Etapa 5: Atualizando Google Sheets remotamente...")
        try {
            await overwriteSheet("Análise Completa", sheetsHeaders, sheetsDataComplete);
            await overwriteSheet("Não Conformes", sheetsHeaders, sheetsDataNC);
            await overwriteSheet("Conformes", sheetsHeaders, sheetsDataC);
        } catch (e) {
            console.error("Erro Não Crítico: Falha ao exportar para o Sheets", e);
        }

        return NextResponse.json({
            success: true,
            message: `Sincronização Finalizada. ${totalAnalisados} Itens de ${emailGroups.length} email(s) importados via IMAP->Supabase->Sheets.`,
            count: totalAnalisados,
            stats: statsAcum
        })

    } catch (error: any) {
        console.error("Erro Severo no Sync Manual Route Handler:", error)
        return NextResponse.json({ error: error.message || 'Erro Interno de Sincronização' }, { status: 500 })
    }
}
