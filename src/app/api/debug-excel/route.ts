import { NextResponse } from 'next/server'
import { fetchExcelAttachments } from '@/utils/imapClient'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const attachments = await fetchExcelAttachments(true)
        if (!attachments.length) {
            return NextResponse.json({ error: 'Nenhum anexo encontrado' })
        }

        const resultado: any[] = []

        for (const att of attachments) {
            const wb = XLSX.read(att.content, { type: 'buffer' })

            const abas: any[] = []
            for (const sheetName of wb.SheetNames) {
                const ws = wb.Sheets[sheetName]
                const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
                abas.push({
                    aba: sheetName,
                    total_linhas: rows.length,
                    colunas: rows.length > 0 ? Object.keys(rows[0]) : [],
                    primeiras_2_linhas: rows.slice(0, 2)
                })
            }

            resultado.push({
                filename: att.filename,
                total_abas: wb.SheetNames.length,
                abas
            })
        }

        return NextResponse.json(resultado, { status: 200 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
