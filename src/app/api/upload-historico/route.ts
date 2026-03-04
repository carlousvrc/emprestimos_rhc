import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analisarItens, AnaliseRow } from '@/utils/analisador'
import * as XLSX from 'xlsx'

// Converte valor serial do Excel, string BR ou ISO para Date
function parseDateExcel(val: any): Date {
    if (!val) return new Date()
    if (typeof val === 'number') {
        return new Date(Math.round((val - 25569) * 86400 * 1000))
    }
    if (typeof val === 'string' && val.includes('/')) {
        const parts = val.split(/[\s/:]+/)
        if (parts.length >= 3) {
            return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`)
        }
    }
    const d = new Date(val)
    return isNaN(d.getTime()) ? new Date() : d
}

// Classifica arquivo como saída, entrada ou ambíguo pelo nome
function classificarArquivo(filename: string): 'saida' | 'entrada' | 'ambiguo' {
    const n = filename.toLowerCase()
    const scoreSaida = ['saida', 'concedido', 'envio'].filter(t => n.includes(t)).length
    const scoreEntrada = ['entrada', 'recebido'].filter(t => n.includes(t)).length
    if (scoreSaida > scoreEntrada) return 'saida'
    if (scoreEntrada > scoreSaida) return 'entrada'
    return 'ambiguo'
}

// Mapeia uma linha do Excel para AnaliseRow (mesma lógica do atualizar-agora)
function rowToAnaliseRow(row: any): AnaliseRow {
    return {
        data: parseDateExcel(
            row['Data'] || row['DATA'] || row['Data/Hora'] || row['data']
        ).toISOString(),
        unidade_origem: String(row['Unidade Origem'] || row['unidade_origem'] || row['Origem'] || ''),
        unidade_destino: String(row['Unidade Destino'] || row['unidade_destino'] || row['Destino'] || ''),
        documento: String(row['Documento'] || row['Nro Doc'] || row['documento'] || ''),
        ds_produto: String(row['Ds Produto'] || row['Produto'] || row['ds_produto'] || ''),
        especie: String(row['Ds Especie'] || row['Especie'] || row['especie'] || ''),
        valor_total: Number(
            String(row['Total'] || row['Valor Total'] || row['valor_total'] || '0')
                .replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.')
        ),
        qt_entrada: Number(
            String(row['Qt Entrada'] || row['Qtd'] || row['Qtd Entrada'] || row['qt_entrada'] || '0')
                .replace(',', '.')
        ),
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const files = formData.getAll('files') as File[]

        if (files.length < 2) {
            return NextResponse.json(
                { error: 'É necessário enviar ao menos 1 arquivo de Saída e 1 de Entrada.' },
                { status: 400 }
            )
        }

        const arquivosSaida: AnaliseRow[] = []
        const arquivosEntrada: AnaliseRow[] = []
        const ambiguos: AnaliseRow[] = []

        for (const file of files) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const workbook = XLSX.read(buffer, { type: 'buffer' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

            if (jsonData.length === 0) continue

            const rows = jsonData.map(rowToAnaliseRow)
            const tipo = classificarArquivo(file.name)

            if (tipo === 'saida') arquivosSaida.push(...rows)
            else if (tipo === 'entrada') arquivosEntrada.push(...rows)
            else ambiguos.push(...rows)
        }

        // Distribui ambíguos: se faltam saídas manda pra lá; senão, para entradas
        if (ambiguos.length > 0) {
            if (arquivosSaida.length === 0) arquivosSaida.push(...ambiguos)
            else arquivosEntrada.push(...ambiguos)
        }

        if (arquivosSaida.length === 0 || arquivosEntrada.length === 0) {
            return NextResponse.json(
                { error: 'Não foi possível identificar arquivos de Saída e Entrada. Verifique se os nomes contêm "concedido/saida" e "recebido/entrada".' },
                { status: 422 }
            )
        }

        // Mesmo algoritmo de análise usado no sync de emails
        const { analise, stats } = analisarItens(arquivosSaida, arquivosEntrada)

        if (analise.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum item foi gerado após a análise. Verifique o formato das planilhas.' },
                { status: 422 }
            )
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const statusMap: Record<string, string> = {
            '✅ Conforme': 'conforme',
            '❌ Não Conforme': 'não conforme',
            '⚠️ Não Recebido': 'não recebido',
        }

        const payload = analise.map(item => ({
            data_transferencia: item.data ? new Date(item.data).toISOString().split('T')[0] : null,
            documento: String(item.doc || ''),
            unidade_origem: item.origem || '',
            unidade_destino: item.destino || '',
            produto_saida: item.prod_saida || '',
            produto_entrada: item.prod_entrada !== '-' ? (item.prod_entrada || null) : null,
            qtd_saida: item.qtd_saida != null ? Number(item.qtd_saida) : null,
            qtd_entrada: item.qtd_entrada != null ? Number(item.qtd_entrada) : null,
            valor_saida: item.val_saida != null ? Number(item.val_saida) : null,
            valor_entrada: item.val_entrada != null ? Number(item.val_entrada) : null,
            diferenca_financeira: item.dif_val != null ? Number(item.dif_val) : null,
            diferenca_quantidade: item.dif_qtd != null ? Number(item.dif_qtd) : null,
            data_recebimento: item.data_entrada ? new Date(item.data_entrada).toISOString().split('T')[0] : null,
            tempo_recebimento: item.tempo_recebimento != null ? Number(item.tempo_recebimento) : null,
            status_item: statusMap[item.status] ?? item.status?.toLowerCase() ?? 'pendente',
        }))

        // Insere em batches de 100
        const BATCH = 100
        let inserted = 0
        for (let i = 0; i < payload.length; i += BATCH) {
            const chunk = payload.slice(i, i + BATCH)
            const { error } = await supabaseAdmin
                .from('itens_clinicos')
                .insert(chunk)
            if (error) {
                console.error('Supabase insert error:', error)
                throw new Error(`Falha ao inserir itens: ${error.message}`)
            }
            inserted += chunk.length
        }

        // Registra consolidado para o dashboard
        await supabaseAdmin.from('analises_consolidadas').insert({
            itens_analisados: analise.length,
            itens_conformes: stats.conformes,
            itens_nao_conformes: stats.nao_conformes,
            itens_pendentes: stats.nao_encontrados,
            divergencia_quantidade: stats.qtd_divergente,
            total_saida: arquivosSaida.reduce((s, r) => s + (Number(r.valor_total) || 0), 0),
            total_entrada: arquivosEntrada.reduce((s, r) => s + (Number(r.valor_total) || 0), 0),
            total_divergencia: stats.valor_divergente,
            data_referencia_arquivos: analise[0]?.data
                ? new Date(analise[0].data).toISOString().split('T')[0]
                : null,
        })

        return NextResponse.json({
            success: true,
            message: `${inserted} de ${analise.length} itens processados e consolidados no Banco RHC com sucesso.`,
        })

    } catch (error: any) {
        console.error('Erro no upload-historico:', error)
        return NextResponse.json(
            { error: error.message || 'Erro interno no processamento.' },
            { status: 500 }
        )
    }
}
