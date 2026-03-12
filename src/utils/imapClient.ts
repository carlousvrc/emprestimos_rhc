import { ImapFlow, SearchObject } from 'imapflow';
import { simpleParser, ParsedMail, Attachment } from 'mailparser';

export async function fetchExcelAttachments(force = false): Promise<{ filename: string; content: Buffer }[]> {
    const user = process.env.GMAIL_USER || 'gestao_mxm@grupohospitalcasa.com.br';
    // Use the App Password generated for the Google Account
    const pass = process.env.GMAIL_APP_PASSWORD || '';

    if (!pass) {
        throw new Error("A variável de ambiente GMAIL_APP_PASSWORD não está configurada.");
    }

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user,
            pass
        },
        logger: false
    });

    const attachmentsFound: { filename: string; content: Buffer }[] = [];

    await client.connect();

    try {
        const lock = await client.getMailboxLock('INBOX');
        try {
            // Busca emails nos últimos 45 dias
            const dateStr = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
            const searchCriteria: SearchObject = { since: dateStr };

            // Filtra por remetente somente se GMAIL_SENDER estiver explicitamente configurada.
            // Se não estiver (ou usar o placeholder padrão), busca todos os remetentes para não
            // bloquear a sincronização por uma variável de ambiente mal configurada.
            const senderEnv = process.env.GMAIL_SENDER || '';
            if (senderEnv) {
                searchCriteria.from = senderEnv;
            }

            // Only filter for unseen if not forcing a resync
            if (!force) {
                searchCriteria.seen = false;
            }

            const subjectFilter = process.env.GMAIL_SUBJECT || '';
            if (subjectFilter) {
                searchCriteria.subject = subjectFilter;
            }

            // Find UIDs matching the criteria
            const uidsSearch = await client.search(searchCriteria, { uid: true });

            if (!uidsSearch || typeof uidsSearch === 'boolean') {
                return []; // No emails found
            }

            const uids = Array.isArray(uidsSearch) ? uidsSearch : [];

            if (uids.length === 0) {
                return []; // No emails found
            }

            // Sort UIDs descending to process the newest first
            uids.sort((a, b) => b - a);

            for (const uid of uids) {
                // Fetch the full message source
                const message = await client.fetchOne(uid.toString(), { source: true }, { uid: true });
                if (!message || !message.source) continue;

                // Parse the raw email source
                const parsed: ParsedMail = await simpleParser(message.source);

                const excelAttachments = parsed.attachments.filter(att =>
                    att.filename && (att.filename.endsWith('.xlsx') || att.filename.endsWith('.xls'))
                );

                if (excelAttachments.length > 0) {
                    for (const att of excelAttachments) {
                        attachmentsFound.push({
                            filename: att.filename || 'unknown.xlsx',
                            content: att.content
                        });
                    }
                    // Mark as seen so we don't process it again on the next sync
                    await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });
                    // Para após encontrar o email mais recente com anexos válidos
                    break;
                }
            }
        } finally {
            lock.release();
        }
    } finally {
        await client.logout();
    }

    return attachmentsFound;
}
