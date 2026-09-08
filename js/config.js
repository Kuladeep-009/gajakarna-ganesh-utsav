/**
 * TEAM GAJAKARNA - Central Configuration & Data Provider
 * Supports both Local Demo Mode (browser localStorage) & Google Apps Script Live Mode
 */

const CONFIG = {
  // Default Payment Details
  defaultUPI: {
    upiId: "gajakarna@upi",
    payeeName: "Team Gajakarna",
    defaultNote: "Ganesh Utsav 2026 Donation",
    customQrUrl: "" // optional custom static image URL if provided
  },

  // Event & Committee Details
  committee: {
    name: "Team Gajakarna",
    event: "Ganesh Utsav 2026",
    dates: "September 14 - September 24, 2026",
    location: "Gajakarna Mandal, Ganesh Chowk, Pune, Maharashtra",
    helpline: "+91 98765 43210",
    email: "contact@teamgajakarna.org"
  },

  // Admin Credentials (default for local authentication)
  adminAuth: {
    username: "admin",
    passwordHash: "bappa2026" // For production, authenticated via Google Apps Script or hashed
  },

  // Google Apps Script Web App Deployment URL
  // Once deployed, paste your Web App URL here (or configure via Admin Settings UI)
  appsScriptUrl: "",

  // Storage Keys
  STORAGE_KEY_DONATIONS: "gajakarna_donations_v1",
  STORAGE_KEY_SETTINGS: "gajakarna_settings_v1",
  STORAGE_KEY_CONTENT: "gajakarna_public_content_v1",
  STORAGE_KEY_ADMIN_SESSION: "gajakarna_admin_session"
};

/**
 * Default Public Website Content (CMS)
 */
const DEFAULT_PUBLIC_CONTENT = {
  // Shloka & Top Bar
  topShloka: "॥ ॐ गं गणपतये नमः । वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥",

  // Hero Section
  heroBadge: "🙏 श्री गणेशाय नमः • Ganesh Utsav 2026",
  heroHeadingPrefix: "Celebrate Devotion, Unity & Joy with ",
  heroHeadingHighlight: "Team Gajakarna",
  heroSubtitle: "Join hands with our community to celebrate the divine arrival of Ganpati Bappa. Your generous contributions support daily Mahapooja, Annadan Mahaprasad, cultural events, and mandal festivities.",
  festivalDates: "September 14 - September 24, 2026",

  // Highlights & Schedule Cards (4 cards)
  highlights: [
    {
      icon: "🪔",
      title: "Daily Mahapooja & Aarti",
      desc: "Morning Aarti at 8:00 AM & Evening Aarti at 7:30 PM with Vedic chants, traditional dhol-tasha, and incense sevas."
    },
    {
      icon: "🍲",
      title: "Mahaprasad & Annadan",
      desc: "Community feast organized on Chaturthi and Ashtami, feeding thousands of devotees and underprivileged families."
    },
    {
      icon: "🌺",
      title: "Eco-Friendly Mandal",
      desc: "100% Shadu clay Bappa idol, organic flower decorations, and zero-waste green immersion process."
    },
    {
      icon: "🎭",
      title: "Cultural & Youth Programs",
      desc: "Traditional folk music, Bhajan Sandhya, drawing competitions for children, and felicitation of local talents."
    }
  ],

  // Committee Members
  committeeMembers: [
    { name: "Shri. Rajesh Patil", role: "President", icon: "🕉️" },
    { name: "Shri. Sachin Deshmukh", role: "Secretary", icon: "📋" },
    { name: "Shri. Nilesh Joshi", role: "Treasurer", icon: "💰" },
    { name: "Shri. Anand Kulkarni", role: "Mahaprasad Head", icon: "🍲" },
    { name: "Team Volunteers", role: "Youth Mandal", icon: "🚩" }
  ],

  // Contact & Location
  contact: {
    address: "Ganesh Chowk, Pune, Maharashtra 411002",
    helpline: "+91 98765 43210",
    email: "contact@teamgajakarna.org",
    officeHours: "Office Hours: 8:00 AM – 9:00 PM IST"
  }
};

/**
 * Public Website Content Manager (CMS)
 */
const ContentManager = {
  getContent: function() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY_CONTENT);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PUBLIC_CONTENT,
          ...parsed,
          contact: { ...DEFAULT_PUBLIC_CONTENT.contact, ...(parsed.contact || {}) },
          highlights: (parsed.highlights && parsed.highlights.length) ? parsed.highlights : DEFAULT_PUBLIC_CONTENT.highlights,
          committeeMembers: (parsed.committeeMembers && parsed.committeeMembers.length) ? parsed.committeeMembers : DEFAULT_PUBLIC_CONTENT.committeeMembers
        };
      }
    } catch (e) {
      console.warn("Could not read content from localStorage", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PUBLIC_CONTENT));
  },

  saveContent: function(content) {
    localStorage.setItem(CONFIG.STORAGE_KEY_CONTENT, JSON.stringify(content));
    if (SettingsManager.isLiveBackend()) {
      try {
        fetch(SettingsManager.getAppsScriptUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "saveSettings",
            data: JSON.stringify({ publicContent: JSON.stringify(content) })
          })
        }).catch(err => console.warn("Background content sync to Sheets failed", err));
      } catch (err) {
        console.warn("Content sync error", err);
      }
    }
    return content;
  },

  resetContent: function() {
    localStorage.removeItem(CONFIG.STORAGE_KEY_CONTENT);
    return JSON.parse(JSON.stringify(DEFAULT_PUBLIC_CONTENT));
  }
};

/**
 * Settings Manager
 */
const SettingsManager = {
  getSettings: function() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...CONFIG.defaultUPI, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Could not read settings from localStorage", e);
    }
    return { ...CONFIG.defaultUPI };
  },

  saveSettings: function(settings) {
    localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    return settings;
  },

  getAppsScriptUrl: function() {
    const s = this.getSettings();
    return s.appsScriptUrl || CONFIG.appsScriptUrl || "";
  },

  isLiveBackend: function() {
    const url = this.getAppsScriptUrl();
    return Boolean(url && url.startsWith("https://script.google.com"));
  }
};

/**
 * Data Storage Manager (Unified interface for LocalStorage & Google Sheets API)
 */
const DataService = {
  // Seed sample records if empty
  initSampleData: function() {
    const existing = localStorage.getItem(CONFIG.STORAGE_KEY_DONATIONS);
    if (!existing || JSON.parse(existing).length === 0) {
      const sampleDonations = [
        {
          id: "TG-26-001",
          name: "Ramesh Sharma",
          mobile: "9823012345",
          amount: 1001,
          category: "General Utsav",
          utr: "425167890123",
          date: "2026-09-08 10:15",
          screenshot: "",
          status: "Verified",
          notes: "Received in SBI Bank Account",
          isAnonymous: false
        },
        {
          id: "TG-26-002",
          name: "Pooja Patil",
          mobile: "9890198765",
          amount: 2101,
          category: "Mahaprasad Seva",
          utr: "425178901234",
          date: "2026-09-08 11:30",
          screenshot: "",
          status: "Verified",
          notes: "Annadan seva donor",
          isAnonymous: false
        },
        {
          id: "TG-26-003",
          name: "Amit Kulkarni",
          mobile: "9765432109",
          amount: 501,
          category: "Flower Decoration",
          utr: "425189012345",
          date: "2026-09-08 12:45",
          screenshot: "",
          status: "Pending",
          notes: "Verification in progress",
          isAnonymous: false
        },
        {
          id: "TG-26-004",
          name: "Anonymous Devotee",
          mobile: "9988776655",
          amount: 5001,
          category: "Aarti Sponsorship",
          utr: "425190123456",
          date: "2026-09-08 14:10",
          screenshot: "",
          status: "Verified",
          notes: "Special evening Aarti",
          isAnonymous: true
        }
      ];
      localStorage.setItem(CONFIG.STORAGE_KEY_DONATIONS, JSON.stringify(sampleDonations));
    }
  },

  // Fetch all donations
  getDonations: async function() {
    if (SettingsManager.isLiveBackend()) {
      try {
        const url = `${SettingsManager.getAppsScriptUrl()}?action=getDonations`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.donations)) {
          return data.donations;
        }
      } catch (err) {
        console.warn("Live backend fetch failed, falling back to local data", err);
      }
    }
    // Fallback to local
    this.initSampleData();
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY_DONATIONS);
    return raw ? JSON.parse(raw) : [];
  },

  // Save new donation
  submitDonation: async function(donationData) {
    if (SettingsManager.isLiveBackend()) {
      try {
        const url = SettingsManager.getAppsScriptUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "submitDonation",
            data: JSON.stringify(donationData)
          })
        });
        const result = await res.json();
        if (result && result.success) {
          return result;
        }
      } catch (err) {
        console.warn("Live backend submit failed, storing locally", err);
      }
    }

    // Local fallback
    this.initSampleData();
    const donations = await this.getDonations();
    const count = donations.length + 1;
    const formattedId = `TG-26-${String(count).padStart(3, "0")}`;
    const newRecord = {
      ...donationData,
      id: formattedId,
      status: "Pending",
      notes: "Pending bank verification",
      date: donationData.date || new Date().toLocaleString("en-IN")
    };
    donations.unshift(newRecord);
    localStorage.setItem(CONFIG.STORAGE_KEY_DONATIONS, JSON.stringify(donations));
    return { success: true, id: formattedId, record: newRecord };
  },

  // Update record (Status, Notes, Donor details)
  updateDonation: async function(updatedRecord) {
    if (SettingsManager.isLiveBackend()) {
      try {
        const url = SettingsManager.getAppsScriptUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "updateDonation",
            data: JSON.stringify(updatedRecord)
          })
        });
        const result = await res.json();
        if (result && result.success) return result;
      } catch (err) {
        console.warn("Live update failed, applying locally", err);
      }
    }

    const donations = await this.getDonations();
    const index = donations.findIndex(d => d.id === updatedRecord.id);
    if (index !== -1) {
      donations[index] = { ...donations[index], ...updatedRecord };
      localStorage.setItem(CONFIG.STORAGE_KEY_DONATIONS, JSON.stringify(donations));
      return { success: true, record: donations[index] };
    }
    return { success: false, error: "Record not found" };
  },

  // Delete donation
  deleteDonation: async function(id) {
    if (SettingsManager.isLiveBackend()) {
      try {
        const url = SettingsManager.getAppsScriptUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "deleteDonation",
            id: id
          })
        });
        const result = await res.json();
        if (result && result.success) return result;
      } catch (err) {
        console.warn("Live delete failed, applying locally", err);
      }
    }

    let donations = await this.getDonations();
    donations = donations.filter(d => d.id !== id);
    localStorage.setItem(CONFIG.STORAGE_KEY_DONATIONS, JSON.stringify(donations));
    return { success: true };
  }
};
