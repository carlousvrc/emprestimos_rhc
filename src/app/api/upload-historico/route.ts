import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as os from 'os'
import * as fs from 'fs'

import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const files = formData.getAll('files') as File[]

        if (files.length === 0) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
        }

        // Identificador único para a sessão do Python
        const sessionId = Date.now().toString()

        // Pasta temporária no servidor (Vercel suporta /tmp)
        const tmpDir = process.env.NODE_ENV === 'production'
            ? join(os.tmpdir(), `rhc_upload_${sessionId}`)
            : join(process.cwd(), 'tmp', `rhc_upload_${sessionId}`)

        // Cria diretório garantido
        await mkdir(tmpDir, { recursive: true })

        // Salva arquivos no disco do Vercel/Local para o Python ler
        for (const file of files) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            // O nome original é importante pro regex do python deduzir se é "saida" ou "entrada"
            const filePath = join(tmpDir, file.name)
            await writeFile(filePath, buffer)
        }

        // Agora precisamos de um mini-script Python invocador ou rodar em CLI os módulos antigos.
        // Como a lógica do usuário era importar o `analise_core.py` pra rodar, faremos o Node chamar o Python pra instigar a pasta tmpDir.
        // Para portabilidade máxima do Vercel vs Local, se formos apenas executar SQL de append, podemos usar Node (mas a lógica Fuzzy do Python é blindada).

        // Para fins do Next.js + Python na Vercel Serverless (Server Actions), a abordagem mais simples e robusta é criar um wrapper local Node exec:
        const pythonScript = `
import sys
import os
import json
import traceback

sys.path.append(r'${process.cwd()}') # Importante pra achar os modulos locais na raiz
try:
    import pandas as pd
    import analise_core

    target_dir = r'''${tmpDir.replace(/\\/g, '\\\\')}'''
    arquivos = [f for f in os.listdir(target_dir) if f.endswith(('.xls', '.xlsx', '.csv'))]

    # Mesma heurística de pontuação antiga do frontend Streamlit:
    termos_saida = ['saida', 'concedido', 'envio']
    termos_entrada = ['entrada', 'recebido']

    temp_saida = []
    temp_entrada = []

    for f in arquivos:
        df = pd.read_excel(os.path.join(target_dir, f)) if f.endswith(('xls','xlsx')) else pd.read_csv(os.path.join(target_dir, f), sep=';', encoding='latin1')
        nome_arquivo = f.lower()
        score_saida = sum(1 for t in termos_saida if t in nome_arquivo)
        score_entrada = sum(1 for t in termos_entrada if t in nome_arquivo)
        if score_saida > score_entrada:
             temp_saida.append(df)
        elif score_entrada > score_saida:
             temp_entrada.append(df)

    if not temp_saida or not temp_entrada:
        print(json.dumps({"error": "Falha de Processamento. É necessário ao menos 1 arquivo de Entrada e 1 de Saida classificados na nomenclatura."}))
        sys.exit(0)

    # Concatena
    df_s_concat = pd.concat(temp_saida, ignore_index=True)
    df_e_concat = pd.concat(temp_entrada, ignore_index=True)
    
    # Processa pela biblioteca central oficial \`analise_core.py\`
    df_s_prep = analise_core.preparar_dataframe(df_s_concat)
    df_e_prep = analise_core.preparar_dataframe(df_e_concat)
    df_res_hist, stats = analise_core.analisar_itens(df_s_prep, df_e_prep)

    # IMPORTANTE: No Next.js em vez de o Python gravar Pickles (q Vercel reseta), faremos o Python cuspir um JSON do cruzamento limpo p/ o Node inserir no Supabase DB SQL.
    # Evita dores de cabeça com Filesystems Serverless efêmeros e torna o app Next 100% autônomo.
    
    # Formata datas para Serializacao
    for col in df_res_hist.columns:
        if pd.api.types.is_datetime64_any_dtype(df_res_hist[col]):
            df_res_hist[col] = df_res_hist[col].dt.strftime('%Y-%m-%d %H:%M:%S')

    df_res_hist = df_res_hist.fillna('') # Evita nulos do JSON 

    records = df_res_hist.to_dict(orient='records')
    print(json.dumps({"success": True, "count": len(records), "data": records, "stats": stats}))

except Exception as e:
    print(json.dumps({"error": str(e), "trace": traceback.format_exc()}))
`
        // Salva o mini-wrapper python pro Node rodar
        const wrapperPath = join(tmpDir, 'runner.py')
        await writeFile(wrapperPath, pythonScript, 'utf8')

        // Roda Python pelo Shell Node Backend
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
        const { stdout, stderr } = await execAsync(pythonCmd + ' "' + wrapperPath + '"')

        let pyResult;
        try {
            pyResult = JSON.parse(stdout.trim())
        } catch {
            console.error("JSON PARSE ERROR. STDOUT: ", stdout, " STDERR:", stderr)
            return NextResponse.json({ error: 'Erro crítico na ponte de Parsing Node/Python', details: stderr }, { status: 500 })
        }

        if (pyResult.error) {
            return NextResponse.json({ error: pyResult.error }, { status: 422 })
        }

        // Se chegou aqui, o Python resolveu a Inteligência com Sucesso e retornou { data: [...] }
        const items = pyResult.data;

        // TODO: Falta inserir 'items' filtrando os duplicados via UPDATE no Supabase (Ou bulk insert ON CONFLICT DO NOTHING)
        // Chamaremos a lógica do Node de Inserção do Supabase:
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! // Usamos a SERVICE KEY p ignorar RLS e inserir como ADMIN server-side
        )

        let rowsInsertedCount = 0;

        // Batch Insert robusto para o Supabase (Evita travamento via POSTGREST timeout)
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

            const { error } = await supabaseAdmin.from('itens_clinicos').upsert(payload, {
                onConflict: 'documento, unidade_origem, unidade_destino, produto_saida' // Unique keys hipotéticas para evitar duplo append
            })
            if (error) console.error("Supabase Error on block insert:", error);
            else rowsInsertedCount += payload.length;
        }

        // Também soma o Consolidado pra View do Dashboard Analises (Baseado no STATS do Python)
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

        // Limpa TMP local do Vercel/Node pós Processamento
        try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (e) { }

        return NextResponse.json({
            success: true,
            message: rowsInsertedCount + " de " + items.length + " itens unicos reconhecidos (" + pyResult.count + " analisados) e processados nos Servidores RHC."
        })

    } catch (error: any) {
        console.error("Erro Severo no Route Handler Historico:", error)
        return NextResponse.json({ error: error.message || 'Erro Interno de Transferência' }, { status: 500 })
    }
}
