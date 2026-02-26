import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchExcelAttachments } from '@/utils/imapClient'
import { analisarItens, AnaliseRow } from '@/utils/analisador'
import { overwriteSheet } from '@/utils/sheetsClient'
import * as XLSX from 'xlsx'

export async function POST(req: Request) {
    try {
        console.log("=== Iniciando Sincronização Nativa Node.js ===")

        // 1. Fetch Attachments via IMAP
        let attachments: { filename: string, content: Buffer }[] = [];
        try {
            console.log(">> Etapa 1: Baixando planilhas de e-mails via IMAP...")
            attachments = await fetchExcelAttachments();
            if (attachments.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: "Nenhum novo email com planilhas para processar neste momento.",
                    count: 0
                })
            }
            console.log(`✅ ${attachments.length} anexo(s) extraído(s) do e-mail.`);
        } catch (e: any) {
            console.error("Erro IMAP:", e);
            return NextResponse.json({ error: "Falha ao conectar no Gmail IMAP: " + e.message }, { status: 500 })
        }

        // 2. Parse Excel with SheetJS (XLSX)
        console.log(">> Etapa 2: Processando arquivos Excel e mesclando dados...")
        const arquivosSaida: AnaliseRow[] = [];
        const arquivosEntrada: AnaliseRow[] = [];
        let primeiraDataArquivo: Date | null = null;

        for (const att of attachments) {
            const workbook = XLSX.read(att.content, { type: 'buffer' });
            // Assume the first sheet is the one we want
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // raw: false ensures cells formatted as dates come back as strings instead of Excel numeric values
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (jsonData.length === 0) continue;

            const nameLow = att.filename.toLowerCase();
            const isSaida = nameLow.includes('saida') || nameLow.includes('concedido') || nameLow.includes('envio');
            const isEntrada = nameLow.includes('entrada') || nameLow.includes('recebido');

            const parseDateExcel = (val: any) => {
                if (!val) return new Date();
                // Se for numero do excel serial
                if (typeof val === 'number') {
                    return new Date(Math.round((val - 25569) * 86400 * 1000));
                }
                // Se for string DD/MM/YYYY
                if (typeof val === 'string' && val.includes('/')) {
                    const parts = val.split(/[\s/:]+/);
                    if (parts.length >= 3) {
                        // Assume DD/MM/YYYY
                        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
                    }
                }
                const d = new Date(val);
                if (!isNaN(d.getTime())) return d;
                return new Date();
            };

            for (const row of jsonData) {
                // Remapeamento genérico tentando achar as colunas que vieram no CSV do Hosp. Casa
                // Hosp Casa columns usually: Data, Unidade Origem, Unidade Destino, Documento, Ds Produto, Total, Qt Entrada
                // We will try exact matches from Python mapping:
                const dataPura = row['Data'] || row['DATA'] || row['Data/Hora'] || row['data'];
                const dataFormatada = parseDateExcel(dataPura);

                if (!primeiraDataArquivo) primeiraDataArquivo = dataFormatada;

                const obj: AnaliseRow = {
                    data: dataFormatada.toISOString(),
                    unidade_origem: String(row['Unidade Origem'] || row['unidade_origem'] || row['Origem'] || ''),
                    unidade_destino: String(row['Unidade Destino'] || row['unidade_destino'] || row['Destino'] || ''),
                    documento: String(row['Documento'] || row['Nro Doc'] || row['documento'] || ''),
                    ds_produto: String(row['Ds Produto'] || row['Produto'] || row['ds_produto'] || ''),
                    especie: String(row['Ds Especie'] || row['Especie'] || ''),
                    valor_total: Number(String(row['Total'] || row['Valor Total'] || row['valor_total'] || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.')),
                    qt_entrada: Number(String(row['Qt Entrada'] || row['Qtd'] || row['Qtd Entrada'] || row['qt_entrada'] || '0').replace(',', '.'))
                };

                // Heuristic if isSaida/isEntrada from filename failed to explicitly separate
                // Python script says: s_saida > s_entrada ? arquivos_saida : arquivos_entrada
                if (isSaida && !isEntrada) {
                    arquivosSaida.push(obj);
                } else if (isEntrada && !isSaida) {
                    arquivosEntrada.push(obj);
                } else {
                    // Guess by document type or column if ambiguous (fallback)
                    arquivosSaida.push(obj); // default guess since usually they are identified
                }
            }
        }

        if (arquivosSaida.length === 0 || arquivosEntrada.length === 0) {
            console.warn("ATENÇÃO: Não foi possível identificar pares Saída/Entrada claros.");
            return NextResponse.json({ success: true, message: "Pares Saída/Entrada inválidos no e-mail", count: 0 });
        }

        // 3. Analyze Data matching Python algorithm
        console.log(">> Etapa 3: Executando algoritmo de análise de correspondência...")
        const { analise, stats } = analisarItens(arquivosSaida, arquivosEntrada);

        // Map analise array of objects into array of arrays for the sheets client matching the Headers
        const sheetsHeaders = [
            "Data", "Unidade Origem", "Unidade Destino", "Documento",
            "Produto (Saída)", "Produto (Entrada)", "Espécie",
            "Valor Saída (R$)", "Valor Entrada (R$)", "Diferença (R$)",
            "Qtd Saída", "Qtd Entrada", "Diferença Qtd",
            "Data Entrada", "Tempo Recebimento (Horas)",
            "Status", "Tipo de Divergência",
            "Qualidade Match", "Observações", "Detalhes Produto"
        ];

        const sheetsDataComplete = [];
        const sheetsDataNC = [];
        const sheetsDataC = [];

        // Data array for inserting into Supabase
        const supabaseRecords = [];

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

            if (item.status && item.status.includes("Não Conforme")) {
                sheetsDataNC.push(rowArr);
            } else if (item.status && item.status.includes("Conforme")) {
                sheetsDataC.push(rowArr);
            }

            // Supabase Payload format
            supabaseRecords.push({
                data_transferencia: item.data ? new Date(item.data) : null,
                documento: String(item.doc || ''),
                unidade_origem: String(item.origem || ''),
                unidade_destino: String(item.destino || ''),
                produto_saida: String(item.prod_saida || ''),
                qtd_saida: Number(item.qtd_saida || 0),
                produto_entrada: item.prod_entrada ? String(item.prod_entrada) : null,
                qtd_entrada: Number(item.qtd_entrada || 0),
                data_recebimento: item.data_entrada ? new Date(item.data_entrada) : null,
                status_item: String(item.status || '').toLowerCase().replace('✅ ', '').replace('❌ ', '').replace('⚠️ ', ''),
                tempo_recebimento: Number(item.tempo_recebimento || 0),
                valor_saida: Number(item.val_saida || 0),
                valor_entrada: Number(item.val_entrada || 0),
                diferenca_financeira: Number(item.dif_val || 0),
                diferenca_quantidade: Number(item.dif_qtd || 0),
            });
        }

        // 4. Update Database
        console.log(">> Etapa 4: Atualizando banco de dados Supabase...")
        if (supabaseRecords.length > 0) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            // Upsert Itens Clinicos in batches
            const BATCH_SIZE = 100;
            for (let i = 0; i < supabaseRecords.length; i += BATCH_SIZE) {
                const chunk = supabaseRecords.slice(i, i + BATCH_SIZE)
                await supabaseAdmin.from('itens_clinicos').upsert(chunk, {
                    onConflict: 'documento, unidade_origem, unidade_destino, produto_saida'
                })
            }

            // Insert Consolidado
            // Sum metrics
            let sumSaida = 0, sumEntrada = 0, sumDivergente = 0, sumPendente = 0;
            analise.forEach(r => {
                sumSaida += Number(r.val_saida || 0);
                sumEntrada += Number(r.val_entrada || 0);
                if (r.status?.includes('Não Conforme')) sumDivergente += Math.abs(Number(r.dif_val || 0));
                if (r.status?.includes('Recebido') || r.status?.includes('Pendente')) sumPendente += Number(r.val_saida || 0);
            })

            await supabaseAdmin.from('analises_consolidadas').insert({
                itens_analisados: analise.length,
                itens_conformes: stats.conformes,
                itens_nao_conformes: stats.nao_conformes,
                itens_pendentes: stats.nao_encontrados,
                divergencia_quantidade: stats.qtd_divergente,
                entradas_inferiores: 0, // Placeholder
                total_saida: sumSaida,
                total_entrada: sumEntrada,
                total_pendente: sumPendente,
                total_divergencia: sumDivergente,
                data_referencia_arquivos: primeiraDataArquivo ? primeiraDataArquivo.toISOString() : new Date().toISOString()
            })
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
            message: `Sincronização 100% Nativa Finalizada. ${analise.length} Itens Analisados e Importados via IMAP->Supabase->Sheets.`,
            count: analise.length,
            stats
        })

    } catch (error: any) {
        console.error("Erro Severo no Sync Manual Route Handler:", error)
        return NextResponse.json({ error: error.message || 'Erro Interno de Sincronizacao' }, { status: 500 })
    }
}
