const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const KEY_FILE = path.resolve(__dirname, '..', process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './service-account-key.json');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Cache: { key: { data, expiresAt } }
const cache = {};
const CACHE_TTL = 0; // Immediate sync (No cache)

async function getSheets() {
  const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: SCOPES });
  return google.sheets({ version: 'v4', auth });
}

async function readSheet(sheetName) {
  const cacheKey = `sheet_${sheetName}`;
  if (cache[cacheKey] && cache[cacheKey].expiresAt > Date.now()) {
    return cache[cacheKey].data;
  }
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:ZZ`,
  });
  const rows = res.data.values || [];
  if (rows.length < 1) return [];
  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ''; });
    return obj;
  });
  cache[cacheKey] = { data, expiresAt: Date.now() + CACHE_TTL };
  return data;
}

function invalidateCache(sheetName) {
  delete cache[`sheet_${sheetName}`];
}

async function appendRow(sheetName, rowData) {
  const sheets = await getSheets();
  // Read headers first
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!1:1`,
  });
  const headers = (res.data.values || [[]])[0];
  const row = headers.map(h => rowData[h] !== undefined ? String(rowData[h]) : '');
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    resource: { values: [row] },
  });
  invalidateCache(sheetName);
}

async function updateCell(sheetName, matchCol, matchVal, updateCol, updateVal) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:ZZ`,
  });
  const rows = res.data.values || [];
  if (rows.length < 1) throw new Error('Sheet empty');
  let headers = rows[0];
  const matchIdx = headers.indexOf(matchCol);
  if (matchIdx === -1) throw new Error(`Match column '${matchCol}' not found`);

  let updateIdx = headers.indexOf(updateCol);

  // Auto-create the column header if it doesn't exist yet
  if (updateIdx === -1) {
    // If we're trying to reset (empty value) and column doesn't exist, nothing to do
    if (String(updateVal).trim() === '') {
      console.log(`[updateCell] Column '${updateCol}' doesn't exist — nothing to clear.`);
      return;
    }
    updateIdx = headers.length;
    const newColLetter = columnLetter(updateIdx);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${newColLetter}1`,
      valueInputOption: 'RAW',
      resource: { values: [[updateCol]] },
    });
    headers = [...headers, updateCol];
  }

  let rowNum = -1;
  for (let i = 1; i < rows.length; i++) {
    const cellVal = String(rows[i][matchIdx] || '').trim().toLowerCase();
    const targetVal = String(matchVal).trim().toLowerCase();
    if (cellVal === targetVal) {
      rowNum = i + 1;
      break;
    }
  }
  if (rowNum === -1) throw new Error(`Row with ${matchCol}=${matchVal} not found`);

  const col = columnLetter(updateIdx);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${col}${rowNum}`,
    valueInputOption: 'RAW',
    resource: { values: [[String(updateVal)]] },
  });
  invalidateCache(sheetName);
}

// Update a row matching TWO columns (for BatchConfig: BatchCode + Topic)
async function updateCellByTwoKeys(sheetName, key1Col, key1Val, key2Col, key2Val, updateCol, updateVal) {
  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z`,
    });
    const rows = res.data.values || [];
    if (rows.length < 1) throw new Error('Sheet empty');
    const headers = rows[0];

    // Convert headers to lowercase for safer matching
    const lowerHeaders = headers.map(h => (h || '').trim().toLowerCase());
    const key1Idx = lowerHeaders.indexOf(key1Col.toLowerCase());
    const key2Idx = lowerHeaders.indexOf(key2Col.toLowerCase());
    const updateIdx = lowerHeaders.indexOf(updateCol.toLowerCase());

    if (key1Idx === -1) throw new Error(`key1Col ${key1Col} not found `);
    if (key2Idx === -1) throw new Error(`key2Col ${key2Col} not found `);
    if (updateIdx === -1) throw new Error(`updateCol ${updateCol} not found `);

    let rowNum = -1;
    const targetKey1 = String(key1Val).trim().toLowerCase();
    const targetKey2 = String(key2Val).trim().toLowerCase();

    for (let i = 1; i < rows.length; i++) {
      const val1 = String(rows[i][key1Idx] || '').trim().toLowerCase();
      const val2 = String(rows[i][key2Idx] || '').trim().toLowerCase();

      if (val1 === targetKey1 && val2 === targetKey2) {
        rowNum = i + 1; break;
      }
    }
    if (rowNum === -1) throw new Error(`Row not found for ${key1Val} and ${key2Val}`);

    const col = columnLetter(updateIdx);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${col}${rowNum}`,
      valueInputOption: 'RAW',
      resource: { values: [[String(updateVal)]] },
    });
    invalidateCache(sheetName);
  } catch (error) {
    console.error(`[updateCellByTwoKeys] ERROR:`, error.message);
    throw error;
  }
}

function columnLetter(index) {
  let letter = '';
  index += 1;
  while (index > 0) {
    let rem = index % 26;
    if (rem === 0) { letter = 'Z' + letter; index = Math.floor(index / 26) - 1; }
    else { letter = String.fromCharCode(64 + rem) + letter; index = Math.floor(index / 26); }
  }
  return letter;
}

module.exports = { readSheet, appendRow, updateCell, updateCellByTwoKeys, invalidateCache };
