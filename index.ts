/**
 * Prints the data in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */

import * as fs from 'fs';
import * as readline from 'readline-sync';
import { promisify } from 'util';
import { google, sheets_v4 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';
const spreadsheetId = '<REDACTED>';
const sheetId = '<REDACTED>';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const getAuthClient = async () => {
  const content = await readFile('credentials.json', { encoding: 'utf-8' });
  const credentials = JSON.parse(content);

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Trying to load existing token from local file first
  try {
    const token = await readFile(TOKEN_PATH, { encoding: 'utf-8' });
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (e) {
    const token = await getToken(oAuth2Client);
    await writeFile(TOKEN_PATH, JSON.stringify(token));
    oAuth2Client.setCredentials(token);
  }

  return oAuth2Client;
};

const main = async () => {
  const oAuth2Client = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  const options = {
    spreadsheetId,
    range: 'Class Data',
  };

  const { data } = await sheets.spreadsheets.values.get(options);
  console.log(data);
};

main().then(() => {
  console.log('DONE');
});

const getToken = async (oAuth2Client) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const code = await readline.question('Enter the code from that page here: ');
  const { tokens } = await oAuth2Client.getToken(code);

  return tokens;
};
