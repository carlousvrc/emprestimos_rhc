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
            // Janela de busca: 7 dias para sync normal, 45 dias para force.
            // Não depende do flag \\Seen — o CRON e o Gmail webmail marcam emails como lidos
            // antes do sync manual, então não filtramos por seen.
            const dayWindow = force ? 45 : 7;
            const dateStr = new Date(Date.now() - dayWindow * 24 * 60 * 60 * 1000);

            // Busca com filtros de remetente/assunto (se configurados)
            const searchCriteria: SearchObject = { since: dateStr };
            const senderEnv = process.env.GMAIL_SENDER || '';
            if (senderEnv) {
                searchCriteria.from = senderEnv;
            }
            const subjectFilter = process.env.GMAIL_SUBJECT || '';
            if (subjectFilter) {
                searchCriteria.subject = subjectFilter;
            }

            let uids = await searchUIDs(client, searchCriteria);

            // Fallback: se não encontrou com filtros, tenta só pela data
            if (uids.length === 0 && (senderEnv || subjectFilter)) {
                console.log(`[IMAP] Busca com filtros retornou 0. Tentando sem remetente/assunto...`);
                const fallbackCriteria: SearchObject = { since: dateStr };
                uids = await searchUIDs(client, fallbackCriteria);
                if (uids.length > 0) {
                    console.log(`[IMAP] Fallback encontrou ${uids.length} email(s). Verifique GMAIL_SENDER="${senderEnv}" e GMAIL_SUBJECT="${subjectFilter}".`);
                }
            }

            if (uids.length === 0) {
                return [];
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

/** Helper: executa IMAP SEARCH e retorna array de UIDs */
async function searchUIDs(client: ImapFlow, criteria: SearchObject): Promise<number[]> {
    const result = await client.search(criteria, { uid: true });
    if (!result || typeof result === 'boolean') return [];
    return Array.isArray(result) ? result : [];
}
