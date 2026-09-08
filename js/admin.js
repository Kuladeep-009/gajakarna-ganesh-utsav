/**
 * TEAM GAJAKARNA - Admin Dashboard & Authentication Logic
 */

let allDonations = [];
let currentEditingId = null;

document.addEventListener("DOMContentLoaded", () => {
  const isLoginPage = window.location.pathname.endsWith("login.html");
  const isAdminPage = window.location.pathname.endsWith("admin.html");

  if (isLoginPage) {
    initLoginPage();
    return;
  }

  if (isAdminPage) {
    checkAdminAuth();
    initAdminDashboard();
  }
});

/**
 * Login Page Logic
 */
function initLoginPage() {
  const session = sessionStorage.getItem(CONFIG.STORAGE_KEY_ADMIN_SESSION);
  if (session) {
    window.location.href = "admin.html";
    return;
  }

  const loginForm = document.getElementById("admin-login-form");
  const fillDemoBtn = document.getElementById("btn-fill-demo");

  if (fillDemoBtn) {
    fillDemoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("login-username").value = CONFIG.adminAuth.username;
      document.getElementById("login-password").value = CONFIG.adminAuth.passwordHash;
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = document.getElementById("login-username").value.trim();
      const p = document.getElementById("login-password").value.trim();

      if (u === CONFIG.adminAuth.username && p === CONFIG.adminAuth.passwordHash) {
        sessionStorage.setItem(CONFIG.STORAGE_KEY_ADMIN_SESSION, JSON.stringify({
          user: u,
          token: "auth_" + Date.now(),
          loginTime: new Date().toISOString()
        }));
        showToast("Welcome to Admin Dashboard!", "success");
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 500);
      } else {
        showToast("Invalid username or password!", "error");
      }
    });
  }
}

/**
 * Authentication Guard
 */
function checkAdminAuth() {
  const session = sessionStorage.getItem(CONFIG.STORAGE_KEY_ADMIN_SESSION);
  if (!session) {
    window.location.href = "login.html";
  }
}

/**
 * Admin Dashboard Initialization
 */
async function initAdminDashboard() {
  // Logout handler
  const logoutBtn = document.getElementById("btn-admin-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(CONFIG.STORAGE_KEY_ADMIN_SESSION);
      window.location.href = "login.html";
    });
  }

  // Setup Tab Navigation
  initAdminTabs();

  // Initialize Website Content Editor (CMS)
  initCmsEditor();

  // Settings button & modal
  setupSettingsModal();

  // Search and Filter Listeners
  const searchInput = document.getElementById("admin-search-input");
  const statusFilter = document.getElementById("admin-filter-status");
  const categoryFilter = document.getElementById("admin-filter-category");

  if (searchInput) searchInput.addEventListener("input", applyFiltersAndRender);
  if (statusFilter) statusFilter.addEventListener("change", applyFiltersAndRender);
  if (categoryFilter) categoryFilter.addEventListener("change", applyFiltersAndRender);

  // CSV Export
  const exportBtn = document.getElementById("btn-export-csv");
  if (exportBtn) exportBtn.addEventListener("click", exportToCSV);

  // Print Report
  const printBtn = document.getElementById("btn-print-admin");
  if (printBtn) printBtn.addEventListener("click", () => window.print());

  // Edit Record Form
  const editForm = document.getElementById("admin-edit-record-form");
  if (editForm) editForm.addEventListener("submit", handleRecordUpdate);

  // Load Data
  await loadAndDisplayDonations();
}

/**
 * Fetch & Compute KPIs
 */
async function loadAndDisplayDonations() {
  try {
    allDonations = await DataService.getDonations();
    updateKPIs(allDonations);
    applyFiltersAndRender();
    updateBackendModeBadge();
  } catch (err) {
    console.error("Failed to load donations:", err);
    showToast("Error loading donation records", "error");
  }
}

function updateKPIs(donations) {
  const verifiedList = donations.filter(d => d.status === "Verified");
  const totalAmount = verifiedList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const pendingCount = donations.filter(d => d.status === "Pending").length;

  // Today's collection
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayVerified = verifiedList.filter(d => d.date && d.date.includes(todayStr));
  const todayAmount = todayVerified.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const kpiTotal = document.getElementById("kpi-total-val");
  const kpiDonors = document.getElementById("kpi-donors-val");
  const kpiToday = document.getElementById("kpi-today-val");
  const kpiPending = document.getElementById("kpi-pending-val");

  if (kpiTotal) kpiTotal.textContent = formatINR(totalAmount);
  if (kpiDonors) kpiDonors.textContent = verifiedList.length;
  if (kpiToday) kpiToday.textContent = formatINR(todayAmount);
  if (kpiPending) kpiPending.textContent = pendingCount;
}

/**
 * Filter & Render Table
 */
function applyFiltersAndRender() {
  const searchVal = (document.getElementById("admin-search-input")?.value || "").toLowerCase().trim();
  const statusVal = document.getElementById("admin-filter-status")?.value || "All";
  const categoryVal = document.getElementById("admin-filter-category")?.value || "All";

  const filtered = allDonations.filter(d => {
    const matchesSearch = !searchVal ||
      (d.name && d.name.toLowerCase().includes(searchVal)) ||
      (d.mobile && d.mobile.includes(searchVal)) ||
      (d.utr && d.utr.toLowerCase().includes(searchVal)) ||
      (d.id && d.id.toLowerCase().includes(searchVal));

    const matchesStatus = statusVal === "All" || d.status === statusVal;
    const matchesCategory = categoryVal === "All" || d.category === categoryVal;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  renderTable(filtered);
}

function renderTable(donations) {
  const tbody = document.getElementById("donation-table-body");
  const countEl = document.getElementById("admin-record-count");
  if (countEl) countEl.textContent = `${donations.length} records found`;

  if (!tbody) return;

  if (donations.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="table-empty-state">
          <div class="empty-icon">📂</div>
          <p>No donation records match the selected filters.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = donations.map(d => {
    const statusClass = d.status ? d.status.toLowerCase() : "pending";
    const statusBadge = `<span class="badge-status status-${statusClass}">${d.status || 'Pending'}</span>`;

    let proofHtml = `<span class="no-proof-pill">No file</span>`;
    if (d.screenshot) {
      proofHtml = `<img src="${d.screenshot}" alt="Proof" class="proof-thumbnail" onclick="openLightbox('${d.screenshot}', '${d.utr}')">`;
    }

    return `
      <tr>
        <td class="col-id">${d.id}</td>
        <td>${d.date || '—'}</td>
        <td>
          <strong>${escapeHtml(d.name)}</strong>
          ${d.isAnonymous ? '<br><small style="color: #E65100;">(Requested Anonymous)</small>' : ''}
        </td>
        <td><a href="tel:${d.mobile}" style="color: inherit; text-decoration: none;">${d.mobile}</a></td>
        <td class="col-amount">${formatINR(d.amount)}</td>
        <td>${d.category || 'General Utsav'}</td>
        <td class="col-utr">${escapeHtml(d.utr)}</td>
        <td style="text-align: center;">${proofHtml}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="table-actions-cell">
            <button class="btn-tbl-action btn-edit" onclick="openEditModal('${d.id}')" title="Edit Record">
              ✏️ Edit
            </button>
            <button class="btn-tbl-action btn-whatsapp" onclick="sendWhatsAppReceipt('${d.id}')" title="Send WhatsApp Receipt">
              💬 WhatsApp
            </button>
            <button class="btn-tbl-action btn-del" onclick="handleDeleteRecord('${d.id}')" title="Delete">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/**
 * Edit Record Modal Handlers
 */
window.openEditModal = function(id) {
  const record = allDonations.find(d => d.id === id);
  if (!record) return;

  currentEditingId = id;
  document.getElementById("edit-modal-title").textContent = `Edit Record ${record.id}`;
  document.getElementById("edit-record-id").value = record.id;
  document.getElementById("edit-name").value = record.name;
  document.getElementById("edit-mobile").value = record.mobile;
  document.getElementById("edit-amount").value = record.amount;
  document.getElementById("edit-utr").value = record.utr;
  document.getElementById("edit-category").value = record.category || "General Utsav";
  document.getElementById("edit-status").value = record.status || "Pending";
  document.getElementById("edit-notes").value = record.notes || "";

  document.getElementById("edit-record-modal").classList.add("active");
};

window.closeEditModal = function() {
  document.getElementById("edit-record-modal").classList.remove("active");
  currentEditingId = null;
};

async function handleRecordUpdate(e) {
  e.preventDefault();
  if (!currentEditingId) return;

  const updated = {
    id: currentEditingId,
    name: document.getElementById("edit-name").value.trim(),
    mobile: document.getElementById("edit-mobile").value.trim(),
    amount: parseFloat(document.getElementById("edit-amount").value),
    utr: document.getElementById("edit-utr").value.trim(),
    category: document.getElementById("edit-category").value,
    status: document.getElementById("edit-status").value,
    notes: document.getElementById("edit-notes").value.trim()
  };

  const res = await DataService.updateDonation(updated);
  if (res && res.success) {
    showToast(`Record ${currentEditingId} updated successfully!`, "success");
    closeEditModal();
    await loadAndDisplayDonations();
  } else {
    showToast("Failed to update record", "error");
  }
}

/**
 * Delete Record
 */
window.handleDeleteRecord = async function(id) {
  if (confirm(`Are you sure you want to delete record ${id}? This action cannot be undone.`)) {
    const res = await DataService.deleteDonation(id);
    if (res && res.success) {
      showToast(`Record ${id} deleted`, "success");
      await loadAndDisplayDonations();
    } else {
      showToast("Could not delete record", "error");
    }
  }
};

/**
 * WhatsApp Receipt Message Generator
 */
window.sendWhatsAppReceipt = function(id) {
  const d = allDonations.find(item => item.id === id);
  if (!d) return;

  const cleanPhone = d.mobile.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const msg = 
`🙏 *गणपति बप्पा मोरया* 🙏
*TEAM GAJAKARNA - GANESH UTSAV 2026*
---------------------------------------
Namaste *${d.name}* ji,

We have verified your generous contribution for Ganesh Utsav 2026!

📋 *Receipt ID:* ${d.id}
💰 *Amount Received:* ₹${d.amount}
🏷️ *Seva / Purpose:* ${d.category || 'General Utsav'}
🔢 *UTR / Ref No:* ${d.utr}
📅 *Date:* ${d.date}
✅ *Status:* ${d.status}

May Lord Ganesha bless you and your family with health, wisdom, and prosperity!

Warm regards,
*Team Gajakarna Organizing Committee*
Pune, Maharashtra 🙏`;

  const encodedMsg = encodeURIComponent(msg);
  const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}`;
  window.open(waUrl, "_blank");
};

/**
 * Lightbox Image Preview
 */
window.openLightbox = function(src, title) {
  const modal = document.getElementById("lightbox-modal");
  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");

  if (modal && img) {
    img.src = src;
    if (caption) caption.textContent = `Payment Proof - UTR: ${title}`;
    modal.classList.add("active");
  }
};

window.closeLightbox = function() {
  const modal = document.getElementById("lightbox-modal");
  if (modal) modal.classList.remove("active");
};

/**
 * Export to CSV
 */
function exportToCSV() {
  if (allDonations.length === 0) {
    showToast("No data to export", "error");
    return;
  }

  const headers = ["Record ID", "Date", "Donor Name", "Mobile", "Amount (INR)", "Seva Category", "UTR / Ref No", "Status", "Admin Notes", "Anonymous"];
  const rows = allDonations.map(d => [
    `"${d.id || ''}"`,
    `"${d.date || ''}"`,
    `"${(d.name || '').replace(/"/g, '""')}"`,
    `"${d.mobile || ''}"`,
    d.amount || 0,
    `"${d.category || ''}"`,
    `"${d.utr || ''}"`,
    `"${d.status || ''}"`,
    `"${(d.notes || '').replace(/"/g, '""')}"`,
    d.isAnonymous ? "Yes" : "No"
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `Team_Gajakarna_Donations_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV Export downloaded successfully!", "success");
}

/**
 * Settings Modal & UPI/Backend Configuration
 */
function setupSettingsModal() {
  const settingsBtn = document.getElementById("btn-open-settings");
  const settingsModal = document.getElementById("settings-modal");
  const settingsForm = document.getElementById("settings-form");
  const resetDemoBtn = document.getElementById("btn-reset-demo-data");

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener("click", () => {
      const current = SettingsManager.getSettings();
      document.getElementById("setting-upi-id").value = current.upiId || "";
      document.getElementById("setting-payee-name").value = current.payeeName || "";
      document.getElementById("setting-default-note").value = current.defaultNote || "";
      document.getElementById("setting-custom-qr").value = current.customQrUrl || "";
      document.getElementById("setting-appscript-url").value = SettingsManager.getAppsScriptUrl();

      // Initialize modal QR upload preview
      setupQrUploadBox("modal-qr-dropzone", "modal-qr-file-input", "modal-qr-preview-box", "modal-qr-preview-img", "modal-btn-remove-qr", "setting-custom-qr", null);

      settingsModal.classList.add("active");
    });
  }

  window.closeSettingsModal = function() {
    if (settingsModal) settingsModal.classList.remove("active");
  };

  if (settingsForm) {
    settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const updated = {
        upiId: document.getElementById("setting-upi-id").value.trim(),
        payeeName: document.getElementById("setting-payee-name").value.trim(),
        defaultNote: document.getElementById("setting-default-note").value.trim(),
        customQrUrl: document.getElementById("setting-custom-qr").value.trim(),
        appsScriptUrl: document.getElementById("setting-appscript-url").value.trim()
      };

      SettingsManager.saveSettings(updated);
      showToast("Settings updated successfully!", "success");
      closeSettingsModal();
      updateBackendModeBadge();
    });
  }

  if (resetDemoBtn) {
    resetDemoBtn.addEventListener("click", () => {
      if (confirm("Reset all donation records to initial sample records?")) {
        localStorage.removeItem(CONFIG.STORAGE_KEY_DONATIONS);
        DataService.initSampleData();
        showToast("Demo data re-seeded!", "success");
        closeSettingsModal();
        loadAndDisplayDonations();
      }
    });
  }

  // Support Tab 3 Payment Settings Form & QR Dropzone
  const tabSettingsForm = document.getElementById("tab-settings-form");
  if (tabSettingsForm) {
    const current = SettingsManager.getSettings();
    const upiIdField = document.getElementById("tab-setting-upi-id");
    const payeeField = document.getElementById("tab-setting-payee-name");
    const noteField = document.getElementById("tab-setting-default-note");
    const customQrField = document.getElementById("tab-setting-custom-qr");
    const appScriptField = document.getElementById("tab-setting-appscript-url");

    if (upiIdField) upiIdField.value = current.upiId || "";
    if (payeeField) payeeField.value = current.payeeName || "";
    if (noteField) noteField.value = current.defaultNote || "";
    if (customQrField) customQrField.value = current.customQrUrl || "";
    if (appScriptField) appScriptField.value = SettingsManager.getAppsScriptUrl();

    // Wire up Tab 3 QR drag-and-drop & file upload
    setupQrUploadBox("tab-qr-dropzone", "tab-qr-file-input", "tab-qr-preview-box", "tab-qr-preview-img", "tab-btn-remove-qr", "tab-setting-custom-qr", "tab-setting-custom-qr-url");

    tabSettingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const updated = {
        upiId: upiIdField.value.trim(),
        payeeName: payeeField.value.trim(),
        defaultNote: noteField.value.trim(),
        customQrUrl: customQrField.value.trim(),
        appsScriptUrl: appScriptField.value.trim()
      };
      SettingsManager.saveSettings(updated);
      showToast("Payment & QR scanner settings saved successfully!", "success");
      updateBackendModeBadge();
    });
  }
}

/**
 * Reusable QR Scanner Image Upload & Drag-and-Drop Handler
 */
function setupQrUploadBox(dropzoneId, fileInputId, previewBoxId, previewImgId, removeBtnId, hiddenInputId, urlInputId) {
  const dropzone = document.getElementById(dropzoneId);
  const fileInput = document.getElementById(fileInputId);
  const previewBox = document.getElementById(previewBoxId);
  const previewImg = document.getElementById(previewImgId);
  const removeBtn = document.getElementById(removeBtnId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const urlInput = urlInputId ? document.getElementById(urlInputId) : null;

  if (!dropzone || !fileInput || !hiddenInput) return;

  // Initialize preview if custom QR already saved
  const currentVal = hiddenInput.value || SettingsManager.getSettings().customQrUrl || "";
  if (currentVal) {
    hiddenInput.value = currentVal;
    if (previewImg) previewImg.src = currentVal;
    if (previewBox) previewBox.style.display = "flex";
    if (urlInput && currentVal.startsWith("http")) urlInput.value = currentVal;
  } else {
    if (previewBox) previewBox.style.display = "none";
  }

  // Click dropzone to trigger hidden file input
  dropzone.onclick = () => {
    fileInput.click();
  };

  // Drag & drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    }, false);
  });

  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt ? dt.files : null;
    if (files && files.length) {
      processQrFile(files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length) {
      processQrFile(e.target.files[0]);
    }
  });

  function processQrFile(file) {
    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image file (JPG, PNG, WebP)", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const base64Data = canvas.toDataURL("image/png", 0.9);
        hiddenInput.value = base64Data;
        if (previewImg) previewImg.src = base64Data;
        if (previewBox) previewBox.style.display = "flex";
        if (urlInput) urlInput.value = "";
        showToast("Scanner image loaded! Click Save to apply.", "success");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Remove QR Button
  if (removeBtn) {
    removeBtn.onclick = () => {
      hiddenInput.value = "";
      fileInput.value = "";
      if (previewImg) previewImg.src = "";
      if (previewBox) previewBox.style.display = "none";
      if (urlInput) urlInput.value = "";
      showToast("Scanner removed. Dynamic QR will be used on Save.", "success");
    };
  }

  // URL fallback input
  if (urlInput) {
    urlInput.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      if (url) {
        hiddenInput.value = url;
        if (previewImg) previewImg.src = url;
        if (previewBox) previewBox.style.display = "flex";
      } else {
        hiddenInput.value = "";
        if (previewBox) previewBox.style.display = "none";
      }
    });
  }
}

/**
 * Admin Navigation Tabs Switcher
 */
function initAdminTabs() {
  const tabBtns = document.querySelectorAll(".admin-tab-btn");
  const tabPanes = document.querySelectorAll(".admin-tab-pane");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTabId = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Top navbar settings button directly switches to tab-settings
  const navSettingsBtn = document.getElementById("btn-open-settings");
  if (navSettingsBtn) {
    navSettingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const settingsTabBtn = document.querySelector('[data-tab="tab-settings"]');
      if (settingsTabBtn) settingsTabBtn.click();
    });
  }
}

/**
 * Website Content Editor (CMS) Logic
 */
function initCmsEditor() {
  const cmsForm = document.getElementById("cms-editor-form");
  const addMemberBtn = document.getElementById("btn-add-committee-row");
  const resetDefaultBtn = document.getElementById("btn-reset-cms-default");

  if (!cmsForm) return;

  // Load current content into form
  loadCmsFormData();

  // Add committee member row
  if (addMemberBtn) {
    addMemberBtn.addEventListener("click", () => {
      addCommitteeMemberRow({ name: "", role: "Volunteer", icon: "🚩" });
    });
  }

  // Handle Form Submission
  cmsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Collect committee members
    const memberRows = document.querySelectorAll(".cms-member-item");
    const committeeMembers = [];
    memberRows.forEach(row => {
      const nameInput = row.querySelector(".member-name-input");
      const roleInput = row.querySelector(".member-role-input");
      const iconInput = row.querySelector(".member-icon-input");
      if (nameInput && nameInput.value.trim()) {
        committeeMembers.push({
          name: nameInput.value.trim(),
          role: roleInput ? roleInput.value.trim() : "Volunteer",
          icon: iconInput ? iconInput.value.trim() : "🕉️"
        });
      }
    });

    const updatedContent = {
      topShloka: document.getElementById("cms-top-shloka").value.trim(),
      heroBadge: document.getElementById("cms-hero-badge").value.trim(),
      festivalDates: document.getElementById("cms-festival-dates").value.trim(),
      heroHeadingPrefix: document.getElementById("cms-hero-prefix").value.trim(),
      heroHeadingHighlight: document.getElementById("cms-hero-highlight").value.trim(),
      heroSubtitle: document.getElementById("cms-hero-subtitle").value.trim(),
      highlights: [
        {
          icon: "🪔",
          title: document.getElementById("cms-card1-title").value.trim(),
          desc: document.getElementById("cms-card1-desc").value.trim()
        },
        {
          icon: "🍲",
          title: document.getElementById("cms-card2-title").value.trim(),
          desc: document.getElementById("cms-card2-desc").value.trim()
        },
        {
          icon: "🌺",
          title: document.getElementById("cms-card3-title").value.trim(),
          desc: document.getElementById("cms-card3-desc").value.trim()
        },
        {
          icon: "🎭",
          title: document.getElementById("cms-card4-title").value.trim(),
          desc: document.getElementById("cms-card4-desc").value.trim()
        }
      ],
      committeeMembers: committeeMembers.length ? committeeMembers : DEFAULT_PUBLIC_CONTENT.committeeMembers,
      contact: {
        address: document.getElementById("cms-contact-address").value.trim(),
        helpline: document.getElementById("cms-contact-helpline").value.trim(),
        email: document.getElementById("cms-contact-email").value.trim(),
        officeHours: document.getElementById("cms-contact-hours").value.trim()
      }
    };

    ContentManager.saveContent(updatedContent);
    showToast("Public website content updated successfully! 🎉", "success");
  });

  // Reset to default
  if (resetDefaultBtn) {
    resetDefaultBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to reset all website text to original defaults?")) {
        ContentManager.resetContent();
        loadCmsFormData();
        showToast("Website content restored to defaults", "success");
      }
    });
  }
}

function loadCmsFormData() {
  const content = ContentManager.getContent();

  // Top Shloka
  const shlokaField = document.getElementById("cms-top-shloka");
  if (shlokaField) shlokaField.value = content.topShloka || "";

  // Hero Section
  const badgeField = document.getElementById("cms-hero-badge");
  const datesField = document.getElementById("cms-festival-dates");
  const prefixField = document.getElementById("cms-hero-prefix");
  const highlightField = document.getElementById("cms-hero-highlight");
  const subtitleField = document.getElementById("cms-hero-subtitle");

  if (badgeField) badgeField.value = content.heroBadge || "";
  if (datesField) datesField.value = content.festivalDates || "";
  if (prefixField) prefixField.value = content.heroHeadingPrefix || "";
  if (highlightField) highlightField.value = content.heroHeadingHighlight || "";
  if (subtitleField) subtitleField.value = content.heroSubtitle || "";

  // Highlights / 4 Cards
  const h = content.highlights || [];
  if (h[0]) {
    const t1 = document.getElementById("cms-card1-title");
    const d1 = document.getElementById("cms-card1-desc");
    if (t1) t1.value = h[0].title || "";
    if (d1) d1.value = h[0].desc || "";
  }
  if (h[1]) {
    const t2 = document.getElementById("cms-card2-title");
    const d2 = document.getElementById("cms-card2-desc");
    if (t2) t2.value = h[1].title || "";
    if (d2) d2.value = h[1].desc || "";
  }
  if (h[2]) {
    const t3 = document.getElementById("cms-card3-title");
    const d3 = document.getElementById("cms-card3-desc");
    if (t3) t3.value = h[2].title || "";
    if (d3) d3.value = h[2].desc || "";
  }
  if (h[3]) {
    const t4 = document.getElementById("cms-card4-title");
    const d4 = document.getElementById("cms-card4-desc");
    if (t4) t4.value = h[3].title || "";
    if (d4) d4.value = h[3].desc || "";
  }

  // Committee Members Container
  const container = document.getElementById("cms-committee-container");
  if (container) {
    container.innerHTML = "";
    const members = content.committeeMembers || [];
    members.forEach(m => addCommitteeMemberRow(m));
  }

  // Contact info
  const c = content.contact || {};
  const addrField = document.getElementById("cms-contact-address");
  const phoneField = document.getElementById("cms-contact-helpline");
  const emailField = document.getElementById("cms-contact-email");
  const hoursField = document.getElementById("cms-contact-hours");

  if (addrField) addrField.value = c.address || "";
  if (phoneField) phoneField.value = c.helpline || "";
  if (emailField) emailField.value = c.email || "";
  if (hoursField) hoursField.value = c.officeHours || "";
}

function addCommitteeMemberRow(member = { name: "", role: "", icon: "🕉️" }) {
  const container = document.getElementById("cms-committee-container");
  if (!container) return;

  const item = document.createElement("div");
  item.className = "cms-member-item";
  item.innerHTML = `
    <input type="hidden" class="member-icon-input" value="${member.icon || '🕉️'}">
    <input type="text" class="form-control member-name-input" placeholder="Member Full Name" value="${escapeHtml(member.name || '')}" required>
    <input type="text" class="form-control member-role-input" placeholder="Role (e.g. President)" value="${escapeHtml(member.role || '')}" required>
    <button type="button" class="btn-remove-member" title="Delete Member">✕</button>
  `;

  item.querySelector(".btn-remove-member").addEventListener("click", () => {
    item.remove();
  });

  container.appendChild(item);
}


function updateBackendModeBadge() {
  const badgeContainer = document.getElementById("backend-mode-badge");
  if (!badgeContainer) return;

  if (SettingsManager.isLiveBackend()) {
    badgeContainer.innerHTML = `
      <div class="mode-switch-banner" style="background: #E8F5E9; border-color: #A5D6A7;">
        <span class="mode-tag" style="color: #2E7D32;">🟢 Live Google Sheets Mode</span>
        <button class="btn-tbl-action" onclick="document.getElementById('btn-open-settings').click()">Change Settings</button>
      </div>
    `;
  } else {
    badgeContainer.innerHTML = `
      <div class="mode-switch-banner">
        <span class="mode-tag">🟡 Local Demo Mode (Browser Storage)</span>
        <small style="color: #6D4C41;">Data is stored in your browser. Connect Google Sheets in Settings for live syncing.</small>
        <button class="btn-tbl-action" onclick="document.getElementById('btn-open-settings').click()">Connect Sheets</button>
      </div>
    `;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
