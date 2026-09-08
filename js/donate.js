/**
 * TEAM GAJAKARNA - Donation & QR Scanner Logic
 */

let qrCodeInstance = null;
let currentAmount = 501;

document.addEventListener("DOMContentLoaded", () => {
  const settings = SettingsManager.getSettings();

  // Populate UPI display
  const upiIdDisplay = document.getElementById("display-upi-id");
  const upiNameDisplay = document.getElementById("display-payee-name");
  if (upiIdDisplay) upiIdDisplay.textContent = settings.upiId;
  if (upiNameDisplay) upiNameDisplay.textContent = settings.payeeName;

  // Preset button handlers
  const presetBtns = document.querySelectorAll(".preset-btn");
  const customInput = document.getElementById("custom-amount-input");

  presetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      presetBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const val = parseInt(btn.dataset.amount, 10);
      currentAmount = val;
      if (customInput) customInput.value = val;
      updateQRCode();
    });
  });

  if (customInput) {
    customInput.value = currentAmount;
    customInput.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val > 0) {
        currentAmount = val;
        presetBtns.forEach(b => {
          if (parseInt(b.dataset.amount, 10) === val) {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });
        updateQRCode();
      }
    });
  }

  // Copy UPI ID button
  const copyBtn = document.getElementById("btn-copy-upi");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const textToCopy = settings.upiId;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`UPI ID copied: ${textToCopy}`, "success");
        }).catch(() => fallbackCopy(textToCopy));
      } else {
        fallbackCopy(textToCopy);
      }
    });
  }

  // Proceed to Confirmation button
  const proceedBtn = document.getElementById("btn-proceed-confirm");
  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      window.location.href = `confirmation.html?amount=${encodeURIComponent(currentAmount)}`;
    });
  }

  // Initialize QR Code
  initQRCode();
});

function fallbackCopy(text) {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
  showToast(`UPI ID copied: ${text}`, "success");
}

function buildUpiUri(amount) {
  const settings = SettingsManager.getSettings();
  const pa = encodeURIComponent(settings.upiId);
  const pn = encodeURIComponent(settings.payeeName);
  const tn = encodeURIComponent(settings.defaultNote || "Ganesh Utsav 2026 Donation");
  const am = amount ? encodeURIComponent(amount) : "";
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

function initQRCode() {
  const container = document.getElementById("qrcode-canvas-wrap");
  if (!container) return;

  const settings = SettingsManager.getSettings();

  // If custom static QR scanner image is uploaded or set
  if (settings.customQrUrl) {
    container.innerHTML = `<img src="${settings.customQrUrl}" alt="Mandal UPI Scanner" style="max-width: 100%; max-height: 210px; object-fit: contain; border-radius: 8px;">`;
    updateMobilePayLink(buildUpiUri(currentAmount));
    return;
  }

  const uri = buildUpiUri(currentAmount);

  qrCodeInstance = new QRCode(container, {
    text: uri,
    width: 210,
    height: 210,
    colorDark: "#1A0C05",
    colorLight: "#FFFFFF",
    correctLevel: QRCode.CorrectLevel.M
  });

  updateMobilePayLink(uri);
}

function updateQRCode() {
  const settings = SettingsManager.getSettings();
  const uri = buildUpiUri(currentAmount);

  if (!settings.customQrUrl && qrCodeInstance) {
    qrCodeInstance.makeCode(uri);
  }
  updateMobilePayLink(uri);

  const qrAmountBadge = document.getElementById("qr-amount-indicator");
  if (qrAmountBadge) {
    qrAmountBadge.textContent = `₹${currentAmount}`;
  }
}

function updateMobilePayLink(uri) {
  const mobileLink = document.getElementById("btn-pay-upi-app");
  if (mobileLink) {
    mobileLink.href = uri;
  }
}
