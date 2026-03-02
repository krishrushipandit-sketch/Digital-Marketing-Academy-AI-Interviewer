require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const KEY_FILE = path.resolve(__dirname, process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './service-account-key.json');

async function setupSheets() {
    if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('your_google_sheet_id')) {
        console.error('❌ Error: GOOGLE_SHEET_ID not set in .env');
        return;
    }

    console.log('🚀 Starting Google Sheets Configuration...');

    let auth;
    try {
        const credentials = require(KEY_FILE);
        auth = google.auth.fromJSON(credentials);
        auth.scopes = ['https://www.googleapis.com/auth/spreadsheets'];

        await auth.authorize();
        console.log('✅ Auth Authorized Successfully');
    } catch (err) {
        console.error('❌ Authentication Failure:', err.message);
        return;
    }

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('🚀 Starting Google Sheets Configuration...');

    const topics = ['meta_ads', 'google_ads', 'seo', 'digital_marketing', 'hr'];
    const sheetStructures = [
        { name: 'Admins', headers: ['Email', 'Name', 'PasswordHash'] },
        { name: 'Students', headers: ['Email', 'Name', 'BatchCode', 'PasswordHash', ...topics] },
        ...topics.map(t => ({ name: t, headers: ['Question', 'ExpectedAnswer', 'Difficulty'] })),
        { name: 'BatchConfig', headers: ['BatchCode', 'Topic', 'Unlocked'] }
    ];

    try {
        // 1. Get existing sheets
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);

        // 2. Create missing sheets and add headers
        for (const struct of sheetStructures) {
            if (!existingSheets.includes(struct.name)) {
                console.log(`Adding sheet: ${struct.name}...`);
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: SPREADSHEET_ID,
                    resource: {
                        requests: [{ addSheet: { properties: { title: struct.name } } }]
                    }
                });
            }

            console.log(`Setting headers for ${struct.name}...`);
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${struct.name}!A1`,
                valueInputOption: 'RAW',
                resource: { values: [struct.headers] }
            });
        }

        // Removed sample questions insertion string as requested by user.

        console.log('✅ Google Sheets Configured Successfully!');
        console.log('You can now log in to the portal.');

    } catch (error) {
        console.error('❌ Error configuring sheets:', error.message);
        if (error.message.includes('permission')) {
            console.error('TIP: Make sure you shared the Google Sheet with the service account email found in your JSON key!');
        }
    }
}

setupSheets();
