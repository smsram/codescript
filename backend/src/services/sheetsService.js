const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const KEYFILEPATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../config/google-service-account.json');
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID; 
const TEMPLATE_ID = process.env.GOOGLE_SHEET_TEMPLATE_ID; // 🚀 NEW: The blank template sheet

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

const createAndShareSheet = async (title) => {
    try {
        if (!FOLDER_ID || !TEMPLATE_ID) {
            throw new Error("GOOGLE_DRIVE_FOLDER_ID or GOOGLE_SHEET_TEMPLATE_ID is missing in .env");
        }

        // Copy the template instead of creating from scratch.
        const copyResponse = await drive.files.copy({
            fileId: TEMPLATE_ID,
            resource: {
                name: `${title} - Live Results`,
                parents: [FOLDER_ID] 
            }
        });

        const spreadsheetId = copyResponse.data.id;

        // Make the copied file public (Anyone with link can view/edit)
        await drive.permissions.create({
            fileId: spreadsheetId,
            resource: {
                type: 'anyone',
                role: 'writer', 
            }
        });

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`;
        
        return { spreadsheetId, sheetUrl };
    } catch (error) {
        // 🚀 Better Error Logging for Google's cryptic messages
        if (error.code === 404) {
            console.error("\n❌ [Google API] 404 ERROR: The Service Account cannot find the Template Sheet.");
            console.error("👉 FIX: Open your Template Sheet in the browser and click 'Share'.");
            console.error("👉 FIX: Paste your Service Account's 'client_email' and grant it 'Viewer' or 'Editor' access.\n");
        } else if (error.code === 403 && error.message.includes('quota')) {
            console.error("\n❌ [Google API] 403 ERROR: Quota Exceeded.");
            console.error("👉 FIX: The Service Account has run out of storage. You MUST use the Template Copy method instead of creating blank sheets.\n");
        } else {
            console.error("[SheetsService] Error creating Google Sheet:", error.message);
        }
        throw error;
    }
};

const syncDataToSheet = async (spreadsheetId, dataRows) => {
    try {
        // Clear existing data
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: 'Sheet1',
        });

        // Write fresh data
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: dataRows
            }
        });
        
        return true;
    } catch (error) {
        console.error("[SheetsService] Error syncing to Google Sheet:", error.message);
        throw error;
    }
};

module.exports = { createAndShareSheet, syncDataToSheet };