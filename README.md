# Digital Marketing Academy AI Interviewer

A scalable, voice-powered interview platform for digital marketing students.

## 🚀 Setup Instructions

### 1. Google Sheets Setup
Prepare a Google Sheet with the following TAB names (case sensitive):
- **Admins**: Columns: `Email`, `Name`, `PasswordHash`
- **Students**: Columns: `Email`, `Name`, `BatchCode`, `PasswordHash`
- **Questions**: Columns: `Topic`, `Question`, `ExpectedAnswer`, `Difficulty`
- **BatchConfig**: Columns: `BatchCode`, `Topic`, `Unlocked`
- **Results**: Columns: `Timestamp`, `StudentEmail`, `BatchCode`, `Topic`, `Score`, `Feedback`, `QuestionsAsked`

### 2. Google Cloud Credentials
1. Create a Project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Sheets API**.
3. Create a **Service Account** under IAM & Admin > Service Accounts.
4. Generate a **JSON Key** for the service account and download it.
5. Rename the file to `service-account-key.json` and place it in the `backend/` folder.
6. **Share your Google Sheet** with the service account email (found in the JSON file).

### 3. Environment Variables
Copy `backend/.env.example` to `backend/.env` and fill in:
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/).
- `GOOGLE_SHEET_ID`: The ID from your Google Sheet URL.
- `JWT_SECRET`: Any random string for security.

### 4. Password Hashing Utility
To add students or admins to the sheet, you need to hash their passwords first:
```bash
cd backend
node hash-password.js "your_secure_password"
```
Copy the resulting hash into the `PasswordHash` column of your sheet.

### 5. Running Locally
**Backend:**
```bash
cd backend
npm install
npm start
```
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🌐 VPS Deployment
1. Upload the project to your Hostinger VPS.
2. Run `chmod +x deploy.sh`.
3. Run `./deploy.sh`.
4. Ensure Nginx is configured to proxy to port 5000.
