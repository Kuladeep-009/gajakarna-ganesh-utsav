/**
 * TEAM GAJAKARNA - Payment Confirmation Logic & E-Receipt Generator
 */

let base64Screenshot = "";

document.addEventListener("DOMContentLoaded", () => {
  // Pre-fill amount from URL params if available
  const urlParams = new URLSearchParams(window.location.search);
  const amountParam = urlParams.get("amount");
  const amountInput = document.getElementById("confirm-amount");
  if (amountParam && amountInput) {
    amountInput.value = amountParam;
  }

  // Pre-fill current date & time
  const dateInput = document.getElementById("confirm-date");
  if (dateInput) {
    const now = new Date();
    const formatted = now.toISOString().slice(0, 16);
    dateInput.value = formatted;
  }

  // Screenshot File Upload Preview & Compression
  setupFileUpload();

  // Form Submit Handler
  const confirmForm = document.getElementById("donation-confirm-form");
  if (confirmForm) {
    confirmForm.addEventListener("submit", handleFormSubmit);
  }

  // Close Receipt Modal
  const closeReceiptBtn = document.getElementById("btn-close-receipt");
  if (closeReceiptBtn) {
    closeReceiptBtn.addEventListener("click", () => {
      document.getElementById("receipt-modal-overlay").classList.remove("active");
      window.location.href = "index.html";
    });
  }

  // Print Receipt Button
  const printReceiptBtn = document.getElementById("btn-print-receipt");
  if (printReceiptBtn) {
    printReceiptBtn.addEventListener("click", () => {
      window.print();
    });
  }
});

function setupFileUpload() {
  const fileInput = document.getElementById("screenshot-input");
  const uploadZone = document.getElementById("file-upload-zone");
  const previewArea = document.getElementById("file-preview-area");
  const previewImg = document.getElementById("file-preview-img");
  const removeBtn = document.getElementById("btn-remove-preview");

  if (!fileInput || !uploadZone) return;

  uploadZone.addEventListener("click", (e) => {
    if (e.target !== removeBtn) {
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image file (JPG/PNG)", "error");
      fileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas
        const canvas = document.createElement("canvas");
        const maxDim = 900;
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

        base64Screenshot = canvas.toDataURL("image/jpeg", 0.78);
        previewImg.src = base64Screenshot;
        previewArea.style.display = "block";
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      base64Screenshot = "";
      fileInput.value = "";
      previewImg.src = "";
      previewArea.style.display = "none";
    });
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("confirm-name").value.trim();
  const mobile = document.getElementById("confirm-mobile").value.trim();
  const amount = parseFloat(document.getElementById("confirm-amount").value);
  const utr = document.getElementById("confirm-utr").value.trim().toUpperCase();
  const category = document.getElementById("confirm-category").value;
  const dateVal = document.getElementById("confirm-date").value;
  const isAnonymous = document.getElementById("confirm-anonymous") ? document.getElementById("confirm-anonymous").checked : false;
  const message = document.getElementById("confirm-message") ? document.getElementById("confirm-message").value.trim() : "";

  // Validation
  if (!name || name.length < 2) {
    showToast("Please enter donor full name", "error");
    return;
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(mobile)) {
    showToast("Please enter a valid 10-digit mobile number", "error");
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid donation amount", "error");
    return;
  }

  if (!utr || utr.length < 6) {
    showToast("Please enter a valid Transaction / UTR reference number", "error");
    return;
  }

  const submitBtn = document.getElementById("btn-submit-donation");
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>⏳</span> Submitting Details...`;

  try {
    const payload = {
      name,
      mobile,
      amount,
      utr,
      category,
      date: dateVal ? dateVal.replace("T", " ") : new Date().toLocaleString("en-IN"),
      screenshot: base64Screenshot,
      isAnonymous,
      message,
      submittedAt: new Date().toISOString()
    };

    const res = await DataService.submitDonation(payload);

    if (res && res.success) {
      showToast("Donation submitted successfully! Bappa bless you 🙏", "success");
      displayReceiptModal(res.record || { ...payload, id: res.id, status: "Pending" });
      document.getElementById("donation-confirm-form").reset();
      base64Screenshot = "";
      document.getElementById("file-preview-area").style.display = "none";
    } else {
      showToast("Could not submit. Please check your details and try again.", "error");
    }
  } catch (err) {
    console.error("Submission failed:", err);
    showToast("An error occurred during submission. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

function displayReceiptModal(record) {
  const modal = document.getElementById("receipt-modal-overlay");
  if (!modal) return;

  document.getElementById("r-id").textContent = record.id;
  document.getElementById("r-name").textContent = record.name;
  document.getElementById("r-mobile").textContent = record.mobile.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");
  document.getElementById("r-amount").textContent = formatINR(record.amount);
  document.getElementById("r-utr").textContent = record.utr;
  document.getElementById("r-category").textContent = record.category || "General Utsav";
  document.getElementById("r-date").textContent = record.date;
  document.getElementById("r-status").textContent = record.status || "Under Verification";

  modal.classList.add("active");
}
