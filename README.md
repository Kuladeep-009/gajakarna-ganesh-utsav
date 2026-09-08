# Team Gajakarna - Ganesh Utsav 2026 Donation Website & Admin Portal

A complete, production-ready, mobile-responsive donation and devotee management website designed for **Team Gajakarna Ganesh Utsav 2026**.

Featuring a sacred festive Indian design aesthetic, dynamic UPI QR code generator, payment confirmation form with instant digital e-receipt generation, and a password-protected admin dashboard with search, filters, verification workflow, WhatsApp receipt generator, CSV export, and Google Sheets + Google Drive backend.

---

## 🌟 Key Features

### 1. Public Devotee Portal
- **Festive Aesthetic**: Saffron (`#E65100`), royal maroon/crimson (`#880E4F`), and golden accents (`#FFB300`) with high-resolution vector Ganesha artwork.
- **Home Page (`index.html`)**:
  - Hero banner with sacred shlokas and festival dates.
  - Live impact counters (Total funds raised, devotee count, days of utsav).
  - Four festival pillars (Mahapooja & Aarti timings, Annadan Mahaprasad, Green Visarjan, Cultural events).
  - Committee showcase & public **Donor Honor Wall** (honoring verified devotees, with anonymous options).
- **Donation & Scanner (`donate.html`)**:
  - Quick auspicious preset amounts: **₹101, ₹251, ₹501, ₹1,001, ₹2,101, ₹5,001** and custom amount input.
  - **Dynamic UPI QR Code**: Real-time client-side generation using `qrcode.min.js`. The QR updates dynamically with the exact amount and payee details.
  - One-click **Copy UPI ID** with toast notification.
  - Direct **Pay with UPI App** button for Android and iOS mobile users.
  - Clear 3-step payment guide.
- **Payment Confirmation Form (`confirmation.html`)**:
  - Pre-fills donation amount from donation page.
  - Validates 10-digit mobile number and 12-digit UPI UTR / Transaction ID.
  - Select Seva purpose (General Utsav, Mahaprasad, Decoration, Aarti).
  - Payment screenshot upload with instant client-side preview & compression.
  - Instant downloadable / printable **E-Receipt Slip** with unique reference code.

### 2. Admin Management Dashboard (`admin.html`)
- **Protected Access (`login.html`)**:
  - Default credentials: `admin` / `bappa2026`.
- **Real-Time KPI Cards**:
  - Total Collection (₹), Verified Donors, Today's Collection (₹), Pending Verifications count.
- **Advanced Table & Controls**:
  - Instant live search by Donor Name, Mobile Number, or UTR ID.
  - Filter by Verification Status (`Pending`, `Verified`, `Rejected`) and Seva Category.
  - Full-screen **Screenshot Lightbox** to verify bank payment proofs.
- **Committee Verification Workflow**:
  - Update status (`Pending` ➔ `Verified` / `Rejected`) with admin remarks.
  - One-click **WhatsApp Acknowledgement Generator**: Pre-formats a respectful message to send directly to donor's WhatsApp with full receipt details.
  - Edit or delete records.
  - **Export to CSV / Excel** with UTF-8 BOM.
  - **Printable Financial Summary** for committee audits.
- **Live QR & Payment Settings Panel**:
  - Update Mandal UPI ID, Payee Name, Default Note, and Custom QR code on the fly without touching any code!

### 3. Dual Backend Architecture
- **Instant Browser Demo Mode (Default)**:
  - Runs 100% locally in your browser using `localStorage`. Pre-loaded with realistic sample records for instant testing.
- **Google Sheets & Drive Live Mode**:
  - Production-ready `Code.gs` script included in `backend/Code.gs`.
  - Automatically stores donations in Google Sheets and uploads screenshot proofs to Google Drive.
  - Simply paste your Web App URL into Admin Settings to switch instantly.

---

## 📂 Project Structure

```text
gajakarna-ganesh-utsav/
│
├── index.html              # Public Home Page
├── donate.html             # Donation & Dynamic UPI QR Scanner
├── confirmation.html       # Payment Confirmation Form & E-Receipt
├── login.html              # Admin Login
├── admin.html              # Full Admin Management Dashboard
│
├── css/
│   ├── style.css           # Core festive design system
│   └── admin.css           # Admin dashboard & table styling
│
├── js/
│   ├── config.js           # Configuration & dual data service
│   ├── main.js             # Shared utilities & donor wall loader
│   ├── donate.js           # UPI URI builder & QR generator
│   ├── confirmation.js     # Form validation & e-receipt logic
│   └── admin.js            # Admin auth, KPIs, filters, WhatsApp & CSV
│
├── assets/
│   ├── ganesha.svg         # Lord Ganesha vector artwork
│   ├── diya.svg            # Festive Diya motif
│   ├── om.svg              # Sacred Om motif
│   └── qrcode.min.js       # Standalone client-side QR library (offline ready)
│
├── backend/
│   ├── Code.gs             # Google Apps Script backend
│   └── SETUP_GUIDE.md      # Step-by-step Google Sheets setup guide
│
└── README.md
```

---

## 🚀 How to Run Locally

You can open the website right away!

### Method 1: Open Directly in Browser
Double-click `index.html` in file explorer to open it in Chrome, Edge, Safari, or Firefox.

### Method 2: Run with Local HTTP Server (Recommended)
Using Python:
```bash
cd gajakarna-ganesh-utsav
python -m http.server 8080
```
Then visit: `http://localhost:8080` in your web browser.

---

## 🔑 Admin Login Credentials
- **URL**: `http://localhost:8080/login.html` (or open `login.html`)
- **Username**: `admin`
- **Password**: `bappa2026`
*(You can also click "Click to auto-fill demo credentials" on the login page)*

---

## ☁️ Connecting Google Sheets Backend
Follow the clear instructions in [`backend/SETUP_GUIDE.md`](backend/SETUP_GUIDE.md) to set up your free Google Sheets database and Google Drive proof storage in under 5 minutes.

---

## 🌐 Deploying to the Web
Since this is a static site with an optional serverless Google Apps Script backend, you can host it for free on:
- **GitHub Pages** (Enable in repo settings)
- **Netlify** (Drag-and-drop the folder)
- **Vercel**
- Any shared hosting / cPanel (Upload to `public_html`)

May Ganpati Bappa bless Team Gajakarna and all devotees with joy and prosperity! 🙏
