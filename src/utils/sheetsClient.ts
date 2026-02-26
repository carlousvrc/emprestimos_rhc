import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const SHEET_ID = "1UOYbkN1Ugo_PZyrRU9Q5WvYFEcsWkm6Y7uwGvyP_NF4";

async function getAuthClient() {
    // Priority 1: Service Account JSON file (like the Python script did)
    const serviceAccountPath = path.join(process.cwd(), 'service_account.json');
    if (fs.existsSync(serviceAccountPath)) {
        const auth = new google.auth.GoogleAuth({
            keyFile: serviceAccountPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        return await auth.getClient();
    }

    // Priority 2: Environment variables (Vercel)
    const credsStr = process.env.GCP_SERVICE_ACCOUNT;
    if (credsStr) {
        let creds;
        try {
            creds = JSON.parse(credsStr);
        } catch (e) {
            throw new Error("GCP_SERVICE_ACCOUNT must be a valid JSON string.");
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: creds.client_email,
                private_key: creds.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        return await auth.getClient();
    }

    throw new Error("No Google Service Account credentials found (service_account.json or GCP_SERVICE_ACCOUNT).");
}

export async function overwriteSheet(sheetName: string, headers: string[], rows: any[][]) {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    try {
        // 1. Clear the sheet
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_ID,
            range: `'${sheetName}'`,
        });

        // 2. Prep data (Headers + Rows)
        const values = [headers, ...rows];

        // 3. Update the sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `'${sheetName}'!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values
            }
        });

        console.log(`✅ [Sheets] Aba "${sheetName}" atualizada com ${rows.length} registros.`);
        return true;
    } catch (e: any) {
        console.error(`❌ [Sheets] Erro ao sobrescrever a aba "${sheetName}":`, e.message);
        return false;
    }
}
