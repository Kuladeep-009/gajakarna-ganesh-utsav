/**
 * TEAM GAJAKARNA - Main Shared Script
 */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Nav Toggle
  const toggleBtn = document.getElementById("mobile-menu-btn");
  const mobileDrawer = document.getElementById("mobile-drawer");

  if (toggleBtn && mobileDrawer) {
    toggleBtn.addEventListener("click", () => {
      mobileDrawer.classList.toggle("open");
    });
  }

  // Hydrate dynamic public website content from CMS
  if (typeof ContentManager !== "undefined") {
    hydratePublicWebsiteContent();
  }

  // Load public donor wall & stats if on index.html
  if (document.getElementById("public-donor-list")) {
    loadPublicDonorWall();
  }
});

/**
 * Hydrate Public Website Content from CMS
 */
function hydratePublicWebsiteContent() {
  const content = ContentManager.getContent();

  // Top Shloka Bar (present on index, donate, confirmation)
  const shlokaEls = document.querySelectorAll(".shloka-text");
  shlokaEls.forEach(el => {
    if (content.topShloka) el.textContent = content.topShloka;
  });

  // Hero Section Elements
  const heroBadge = document.getElementById("public-hero-badge");
  if (heroBadge && content.heroBadge) {
    heroBadge.textContent = content.heroBadge;
  }

  const heroHeading = document.getElementById("public-hero-heading");
  if (heroHeading && (content.heroHeadingPrefix || content.heroHeadingHighlight)) {
    heroHeading.innerHTML = `${escapeHtml(content.heroHeadingPrefix || '')}<span class="highlight">${escapeHtml(content.heroHeadingHighlight || '')}</span>`;
  }

  const heroSubtitle = document.getElementById("public-hero-subtitle");
  if (heroSubtitle && content.heroSubtitle) {
    heroSubtitle.textContent = content.heroSubtitle;
  }

  // Utsav Schedule Highlights Cards
  const utsavGrid = document.getElementById("public-utsav-grid");
  if (utsavGrid && content.highlights && content.highlights.length) {
    utsavGrid.innerHTML = content.highlights.map(item => `
      <div class="utsav-card">
        <div class="utsav-card-icon">${item.icon || '🪔'}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.desc)}</p>
      </div>
    `).join("");
  }

  // Committee Members Grid
  const teamGrid = document.getElementById("public-team-grid");
  if (teamGrid && content.committeeMembers && content.committeeMembers.length) {
    teamGrid.innerHTML = content.committeeMembers.map(m => `
      <div class="team-card">
        <div class="team-avatar-box">${m.icon || '🕉️'}</div>
        <h4>${escapeHtml(m.name)}</h4>
        <span class="team-role">${escapeHtml(m.role)}</span>
      </div>
    `).join("");
  }

  // Contact & Location Details
  if (content.contact) {
    const addrEl = document.getElementById("public-contact-address");
    const phoneEl = document.getElementById("public-contact-helpline");
    const emailEl = document.getElementById("public-contact-email");
    const hoursEl = document.getElementById("public-contact-hours");

    if (addrEl && content.contact.address) addrEl.textContent = `📍 ${content.contact.address}`;
    if (phoneEl && content.contact.helpline) {
      phoneEl.textContent = `📞 Helpline: ${content.contact.helpline}`;
    }
    if (emailEl && content.contact.email) {
      emailEl.textContent = `✉️ Email: ${content.contact.email}`;
    }
    if (hoursEl && content.contact.officeHours) hoursEl.textContent = content.contact.officeHours;
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

/**
 * Toast Notification System
 */
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icon = type === "success" ? "✅" : "⚠️";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Format Currency (INR)
 */
function formatINR(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

/**
 * Load Public Donor Wall & Hero Stats (on index.html)
 */
async function loadPublicDonorWall() {
  const donorListEl = document.getElementById("public-donor-list");
  const totalAmountEl = document.getElementById("stat-hero-total");
  const totalDonorsEl = document.getElementById("stat-hero-donors");

  if (!donorListEl) return;

  try {
    const donations = await DataService.getDonations();
    const verified = donations.filter(d => d.status === "Verified");

    // Calculate sum
    const totalSum = verified.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    if (totalAmountEl) totalAmountEl.textContent = formatINR(totalSum);
    if (totalDonorsEl) totalDonorsEl.textContent = verified.length;

    if (verified.length === 0) {
      donorListEl.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #8D6E63; padding: 20px;">No public donations yet. Be the first devotee to contribute!</p>`;
      return;
    }

    donorListEl.innerHTML = verified.map(d => {
      const displayName = d.isAnonymous ? "Devotee (Anonymous)" : (d.name || "Generous Devotee");
      const initial = d.isAnonymous ? "🙏" : displayName.charAt(0).toUpperCase();
      return `
        <div class="donor-item">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #FFE082; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #BF360C; font-size: 0.9rem;">
              ${initial}
            </div>
            <div class="donor-info">
              <h5>${displayName}</h5>
              <small>${d.category || 'General Utsav'} • ${d.date ? d.date.split(' ')[0] : '2026'}</small>
            </div>
          </div>
          <div class="donor-badge-amount">${formatINR(d.amount)}</div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("Error loading public donor wall:", err);
  }
}
