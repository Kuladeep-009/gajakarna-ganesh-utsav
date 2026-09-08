# Google Sheets & Apps Script Backend Deployment Guide

Follow these simple steps to connect your **Team Gajakarna Ganesh Utsav** website to a live Google Sheet database and Google Drive folder for payment screenshots.

---

## Step 1: Create the Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a **Blank spreadsheet**.
2. Rename the spreadsheet to:
   ```text
   Team Gajakarna Donations 2026
   ```
3. (Optional) You do not need to manually create columns or headers—`Code.gs` will automatically create and format the `Donations` and `Settings` sheets for you on first run!

---

## Step 2: Open Google Apps Script Editor
1. In your Google Sheet, click on the top menu:
   **Extensions ➔ Apps Script**.
2. A new tab will open with the script editor.
3. Rename the project at the top left to:
   ```text
   Gajakarna Donation Backend
   ```
4. Delete any default code inside `Code.gs`.
5. Open `backend/Code.gs` from your project folder, copy all code, and paste it into the Apps Script editor.
6. Click the **Save** icon (💾) or press `Ctrl + S`.

---

## Step 3: Deploy as Web App
1. At the top right of the Apps Script editor, click **Deploy ➔ New deployment**.
2. Click the gear icon (**Select type**) next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `Gajakarna Donation API v1`
   - **Execute as**: `Me (your_email@gmail.com)` *(Important!)*
   - **Who has access**: `Anyone` *(Crucial so donors can submit donations from your website without needing to log in)*
4. Click **Deploy**.

---

## Step 4: Authorize Google Permissions
1. A dialog titled **"Authorization required"** will appear.
2. Click **Authorize access**.
3. Choose your Google Account.
4. If Google displays a warning *"Google hasn't verified this app"*:
   - Click **Advanced** (bottom left).
   - Click **Go to Gajakarna Donation Backend (unsafe)**.
5. Click **Allow** to permit the script to create sheets and save payment screenshots to your Google Drive.

---

## Step 5: Copy Your Web App URL
1. Once deployed, you will see a screen with **Web app URL**:
   ```text
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
2. Click **Copy** to copy this URL.

---

## Step 6: Connect to Your Website
You can connect your website to your new backend in either of two ways:

### Option A: Via Admin Dashboard (Zero code editing!)
1. Open `admin.html` in your browser.
2. Click **⚙️ QR / UPI Settings** in the top navigation bar.
3. Paste your Web App URL into the **Google Apps Script Web App URL** field.
4. Click **Save Settings**.
5. Your dashboard will now display `🟢 Live Google Sheets Mode`!

### Option B: In `js/config.js`
1. Open `js/config.js` in your editor.
2. Find:
   ```javascript
   appsScriptUrl: "",
   ```
3. Paste your URL inside the quotes:
   ```javascript
   appsScriptUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
   ```
4. Save the file.

---

## Verification & Features

- **Google Sheet**: Every donation submitted will automatically create a row with ID (`TG-26-001`, `TG-26-002`, etc.), Timestamp, Donor Name, Mobile, Amount, Category, UTR, and status `Pending`.
- **Google Drive**: Payment screenshots are automatically uploaded to a dedicated Google Drive folder named `Gajakarna Donation Proofs 2026` with direct clickable view links saved into the spreadsheet.
- **Admin Verification**: When an admin verifies a donation on `admin.html`, the status and admin remarks are updated directly in Google Sheets in real-time.
