import { NextResponse } from 'next/server'
import { ImapFlow, SearchObject } from 'imapflow'
import { simpleParser, ParsedMail } from 'mailparser'

export const dynamic = 'force-dynamic'

export async function GET() {
    const user = process.env.GMAIL_USER || 'carlos.victor@grupohospitalcasa.com.br'
    const pass = process.env.GMAIL_APP_PASSWORD || ''

    if (!pass) {
        return NextResponse.json({ error: "GMAIL_APP_PASSWORD não configurada" }, { status: 500 })
    }

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user, pass },
        logger: false
    })

    try {
        await client.connect()
        const lock = await client.getMailboxLock('INBOX')
        try {
            // Buscar emails de 01/03/2026
            const dateStr = new Date('2026-03-01T00:00:00Z')
            const searchCriteria: SearchObject = {
                since: dateStr,
                before: new Date('2026-03-02T00:00:00Z'),
                from: 'pedro.gomes@hospitaldecancer.com.br'
            }

            const uids = await client.search(searchCriteria)
            if (!uids || !Array.isArray(uids) || uids.length === 0) {
                return NextResponse.json({ message: "Nenhum email encontrado para 01/03/2026" })
            }

            const emails: any[] = []
            for (const uid of uids) {
                const message = await client.fetchOne(uid.toString(), { envelope: true, source: true })
                if (!message || !message.source) continue;

                const parsed: ParsedMail = await simpleParser(message.source)

                emails.push({
                    uid,
                    subject: parsed.subject,
                    date: parsed.date,
                    from: parsed.from?.text,
                    attachments: parsed.attachments.map(a => ({
                        filename: a.filename,
                        contentType: a.contentType,
                        size: a.size
                    }))
                })
            }

            return NextResponse.json(emails)
        } finally {
            lock.release()
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    } finally {
        await client.logout()
    }
}
