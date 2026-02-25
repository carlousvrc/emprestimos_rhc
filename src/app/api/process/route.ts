import { NextRequest, NextResponse } from "next/server"
import * as xlsx from "xlsx"
import { analisarItens, AnaliseRow } from "@/utils/analisador"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const files = formData.getAll('files') as File[]

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
        }

        const saidas: AnaliseRow[] = []
        const entradas: AnaliseRow[] = []

        for (const file of files) {
            const buffer = await file.arrayBuffer()
            const wb = xlsx.read(buffer, { type: 'buffer' })
            const firstSheet = wb.Sheets[wb.SheetNames[0]]
            // raw param para manter formatação base
            const data = xlsx.utils.sheet_to_json<any>(firstSheet, { raw: false })

            const fileName = file.name.toLowerCase()

            // Normalização pré-analise de colunas para matches exatos
            const normalizedData = data.map((row: any) => ({
                data: row['Data'] || row['DATA'] || row['Data Transação'] || '',
                unidade_origem: row['Unidade Origem'] || row['Origem'] || row['Filial Saida'] || '',
                unidade_destino: row['Unidade Destino'] || row['Destino'] || row['Filial Entrada'] || '',
                documento: String(row['Documento'] || row['NF'] || row['Nr Doc'] || ''),
                ds_produto: String(row['Produto'] || row['Descricao'] || row['ds_produto'] || ''),
                valor_total: parseFloat(String(row['Valor'] || row['VLR TOTAL'] || row['valor_total'] || '0').replace(',', '.')),
                qt_entrada: parseFloat(String(row['Qtd'] || row['Quantidade'] || row['qt_entrada'] || '0').replace(',', '.'))
            })) as AnaliseRow[]

            if (fileName.includes('saida') || fileName.includes('concedido') || fileName.includes('envio')) {
                saidas.push(...normalizedData)
            } else if (fileName.includes('entrada') || fileName.includes('recebido')) {
                entradas.push(...normalizedData)
            }
        }

        if (saidas.length === 0 || entradas.length === 0) {
            return NextResponse.json({
                error: "É necessário p/ arquivos enviar pelo menos um contendo Saídas e outro Entradas."
            }, { status: 400 })
        }

        // Processamento pesado similaridade String Match
        const { analise, stats } = analisarItens(saidas, entradas)

        return NextResponse.json({
            success: true,
            stats,
            data: analise
        })

    } catch (error) {
        console.error("Erro no processamento:", error)
        return NextResponse.json({ error: "Falha ao processar arquivos." }, { status: 500 })
    }
}
