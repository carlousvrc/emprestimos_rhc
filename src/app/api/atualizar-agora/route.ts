import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as os from 'os'
import * as fs from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

export async function POST(req: Request) {
    try {
        const sessionId = Date.now().toString()

        const tmpDir = process.env.NODE_ENV === 'production'
            ? join(os.tmpdir(), `rhc_sync_${sessionId}`)
            : join(process.cwd(), 'tmp', `rhc_sync_${sessionId}`)

        await fs.promises.mkdir(tmpDir, { recursive: true })

        // Para o botão de "Atualizar Agora", precisamos forçar o `auto_analise.py` a fazer o download dos emails e retornar os stats para salvarmos no Supabase.
        // Vamos criar um script Wrapper isolado só para essa thread de "Forçar Atualização"
        const pythonScript = `
import sys
import os
import json
import traceback

sys.path.append(r'${process.cwd().replace(/\\/g, '\\\\')}') # Diretorio Raiz para achar dotenv, auto_analise e rhc_email
try:
    import pandas as pd
    import auto_analise

    # Engatilha a extração de e-mails em silêncio.
    from rhc_email import process_unseen_emails
    novos = process_unseen_emails()
    
    if not novos:
         print(json.dumps({"success": True, "message": "Nenhum novo email com planilhas para processar neste momento.", "count": 0}))
         sys.exit(0)

    # Roda a analise no que baixou
    db_pkl, stats = auto_analise.executar_cruzamento_e_salvar()

    if int(stats['total_analisado']) > 0:
         # Precisamos cuspir isso pro Node salvar
         df = pd.read_pickle(db_pkl)['df']
         for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')

         df = df.fillna('')
         records = df.to_dict(orient='records')
         print(json.dumps({"success": True, "count": len(records), "data": records, "stats": stats}))
    else:
         print(json.dumps({"success": True, "message": "Baixados mas ignorados (Duplicatas totais)", "count": 0}))

except Exception as e:
    print(json.dumps({"error": str(e), "trace": traceback.format_exc()}))
`
        const wrapperPath = join(tmpDir, 'runner_sync.py')
        await fs.promises.writeFile(wrapperPath, pythonScript, 'utf8')

        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
        // Formata o exec corretamente sem template literal quebravel em string escape
        const { stdout, stderr } = await execAsync(pythonCmd + ' "' + wrapperPath + '"')

        let pyResult;
        try {
            pyResult = JSON.parse(stdout.trim())
        } catch {
            console.error("JSON PARSE ERROR. STDOUT: ", stdout, " STDERR:", stderr)
            return NextResponse.json({ error: 'Erro de Execução do Python Mailer' }, { status: 500 })
        }

        if (pyResult.error) {
            return NextResponse.json({ error: pyResult.error }, { status: 422 })
        }

        if (pyResult.count > 0 && pyResult.data) {
            // Envia para Supabase
            const items = pyResult.data;

            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            const BATCH_SIZE = 100;
            for (let i = 0; i < items.length; i += BATCH_SIZE) {
                const chunk = items.slice(i, i + BATCH_SIZE)
                const payload = chunk.map((c: any) => ({
                    data_transferencia: c['Data'] ? new Date(c['Data']) : null,
                    documento: c['Documento'].toString(),
                    unidade_origem: c['Unidade Origem'],
                    unidade_destino: c['Unidade Destino'],
                    produto_saida: c['Produto (Saída)'],
                    qtd_saida: c['Qtd Saída'] ? Number(c['Qtd Saída']) : null,
                    produto_entrada: c['Produto (Entrada)'] || null,
                    qtd_entrada: c['Qtd Entrada'] ? Number(c['Qtd Entrada']) : null,
                    data_recebimento: c['Data Entrada'] ? new Date(c['Data Entrada']) : null,
                    status_item: c['Status']?.toLowerCase(),
                    tempo_recebimento: c['Tempo Recebimento (Horas)'] ? Number(c['Tempo Recebimento (Horas)']) : null,
                    valor_saida: c['Valor Saída (R$)'] ? Number(c['Valor Saída (R$)']) : null,
                    valor_entrada: c['Valor Entrada (R$)'] ? Number(c['Valor Entrada (R$)']) : null,
                    diferenca_financeira: c['Diferença (R$)'] ? Number(c['Diferença (R$)']) : null,
                    diferenca_quantidade: c['Diferença Qtd'] ? Number(c['Diferença Qtd']) : null,
                }))

                await supabaseAdmin.from('itens_clinicos').upsert(payload, {
                    onConflict: 'documento, unidade_origem, unidade_destino, produto_saida'
                })
            }

            if (pyResult.stats) {
                await supabaseAdmin.from('analises_consolidadas').insert({
                    itens_analisados: pyResult.stats.total_analisado,
                    itens_conformes: pyResult.stats.conformes,
                    itens_nao_conformes: pyResult.stats.nao_conformes,
                    itens_pendentes: pyResult.stats.pendentes,
                    divergencia_quantidade: pyResult.stats.divergencias_qtd,
                    entradas_inferiores: pyResult.stats.entradas_anteriores,
                    total_saida: pyResult.stats.total_saida,
                    total_entrada: pyResult.stats.total_entrada,
                    total_pendente: pyResult.stats.valor_pendente,
                    total_divergencia: pyResult.stats.valor_divergente,
                    data_referencia_arquivos: items[0]['Data']
                })
            }
        }

        try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (e) { }

        return NextResponse.json({
            success: true,
            message: pyResult.message || `Sincronização Finalizada. ${pyResult.count || 0} Itens Analisados e Importados via IMAP.`
        })

    } catch (error: any) {
        console.error("Erro Severo no Sync Manual Route Handler:", error)
        return NextResponse.json({ error: error.message || 'Erro Interno de Sincronizacao' }, { status: 500 })
    }
}
