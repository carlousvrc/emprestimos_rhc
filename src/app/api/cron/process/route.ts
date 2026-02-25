import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';

// A inicialização foi movida para o contexto da request (Runtime)

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution time for Vercel Cron

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Camada de Segurança: Apenas a infra da Vercel Cron (ou quem sabe a chave) pode disparar.
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Acesso Não Autorizado. Faltando CRON_SECRET.' }, { status: 401 });
    }

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        return NextResponse.json({ error: 'Configuração de GMAIL ausente no Vercel (.env)' }, { status: 500 });
    }

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user, pass },
        logger: false
    });

    try {
        await client.connect();

        // Abre a Caixa de Entrada Primária
        let lock = await client.getMailboxLock('INBOX');
        try {

            // Busca mensagens dos últimos 5 dias
            const date = new Date();
            date.setDate(date.getDate() - 5);
            const searchCriteria = { since: date };

            // Itera por todas as caixas baseadas na query
            const messages: any[] = [];
            for await (let msg of client.fetch(searchCriteria, { uid: true, envelope: true })) {
                messages.push(msg);
            }

            if (messages.length === 0) {
                return NextResponse.json({ message: 'Nenhum email processável (últimos 5d) encontrado na caixa.' }, { status: 200 });
            }

            // Ordena por ordem de chegada desc e pega a mais nova
            messages.sort((a, b) => (b.envelope.date?.getTime() || 0) - (a.envelope.date?.getTime() || 0));
            latestMailLoop:
            for (const msg of messages) {

                // Faz o Download e parsing Full do MIME da mensagem mais recente
                let messageData = await client.download(msg.uid.toString());
                const parsed = await simpleParser(messageData.content);

                const excelAttachments = parsed.attachments.filter(att =>
                    att.filename && (att.filename.endsWith('.xls') || att.filename.endsWith('.xlsx'))
                );

                if (excelAttachments.length > 0) {
                    console.log(`[PROCESSANDO EMAIL] Assunto: ${parsed.subject}`);

                    const buffer = excelAttachments[0].content;
                    const workbook = xlsx.read(buffer, { type: 'buffer' });

                    if (!workbook.SheetNames.length) continue;

                    const sheetName = workbook.SheetNames[0];
                    const records = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

                    // === MOCKUP DA ENGINE DE PROCESSAMENTO E CONSOLIDAÇÃO ===
                    // Lógica similar Python auto_analise.py (Processando itens clínicos e calculando match/divergência)
                    let totalItens = records.length;
                    let totalSaida = 0;
                    let conformes = 0;
                    let divergentes = 0;
                    let pendentes = 0;
                    const arrayParaSalvar: any[] = [];

                    for (const row of records) {
                        const valor = parseFloat(row['Valor'] || row['Total'] || '0') || 100;
                        totalSaida += valor;

                        // Mock probabilístico simples para substituição da engine NLP
                        const r = Math.random();
                        let stat = 'conforme';
                        if (r > 0.8) { stat = 'divergente'; divergentes++; }
                        else if (r > 0.9) { stat = 'pendente'; pendentes++; }
                        else conformes++;

                        arrayParaSalvar.push({
                            unidade_origem: row['Origem'] || 'Hospital Central',
                            unidade_destino: row['Destino'] || 'Filial Oculta',
                            documento: String(row['Documento'] || row['DOC'] || `REQ-${Math.floor(Math.random() * 9000)}`),
                            produto_saida: row['Produto'] || row['Descricao'] || 'Insumo Médico',
                            produto_entrada: row['Produto'] || row['Descricao'] || 'Insumo Médico',
                            status_item: stat,
                            valor_saida: valor,
                            data_transferencia: new Date().toISOString()
                        });
                    }

                    // ============ 1. GRAVA OS TOTAIS NA TABELA `analises_consolidadas` ============
                    const { data: analise, error: errAnalise } = await supabase
                        .from('analises_consolidadas')
                        .insert({
                            arquivo_referencia: excelAttachments[0].filename,
                            total_saida: totalSaida,
                            total_entrada: totalSaida * 0.85, // Mock Simulando divergencia macro
                            itens_analisados: totalItens,
                            itens_conformes: conformes,
                            itens_nao_conformes: divergentes,
                            itens_pendentes: pendentes,
                            divergencia_quantidade: Math.floor(divergentes / 2)
                        })
                        .select('id').single();

                    if (errAnalise || !analise) throw new Error("Erro salvando consolidado: " + errAnalise?.message);

                    // ============ 2. GRAVA AS LINHAS NA TABELA `itens_clinicos` ============
                    const payloadsDB = arrayParaSalvar.map(a => ({ ...a, analise_id: analise.id }));

                    // Se muito grande, deve ser dividido em chunks no futuro, mas testando 1k é OK
                    const { error: errItems } = await supabase.from('itens_clinicos').insert(payloadsDB);
                    if (errItems) console.warn("Erro parcial ao inserir logs das linhas: ", errItems);

                    return NextResponse.json({
                        success: true,
                        message: `Processamento do anexo '${excelAttachments[0].filename}' concluído no Edge e enviado pro Supabase.`,
                        analiseId: analise.id
                    }, { status: 200 });
                }
            }

            return NextResponse.json({ message: 'Nenhum as anexos Excel encontrados nos limites da busca IMAP.' }, { status: 200 });
        } finally {
            lock.release();
        }
    } catch (error: any) {
        console.error("Erro Fluxo Cron ImapFlow", error);
        return NextResponse.json({ error: error.message || 'Erro Interno de processamento.' }, { status: 500 });
    } finally {
        await client.logout();
    }
}
