/**
 * ============================================================================
 * TEAM GAJAKARNA - GANESH UTSAV 2026 DONATION SYSTEM
 * Google Apps Script Backend (Code.gs)
 * ============================================================================
 * Handles Google Sheets database storage, Google Drive screenshot uploads,
 * and REST API endpoints for the donation website & admin portal.
 */

// Configuration
var SCRIPT_PROP = PropertiesService.getScriptProperties();
var SHEET_DONATIONS_NAME = "Donations";
var SHEET_SETTINGS_NAME = "Settings";
var DRIVE_FOLDER_NAME = "Gajakarna Donation Proofs 2026";

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getDonations";
  var responseData = {};

  try {
    if (action === "getDonations") {
      responseData = {
        success: true,
        donations: getAllDonations()
      };
    } else if (action === "getPublicStats") {
      responseData = {
        success: true,
        stats: getPublicDonorWallData()
      };
    } else if (action === "getSettings") {
      responseData = {
        success: true,
        settings: getSettingsFromSheet()
      };
    } else {
      responseData = { success: false, error: "Invalid action" };
    }
  } catch (err) {
    responseData = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  var responseData = {};

  try {
    var params = e.parameter;
    var action = params.action;
    var rawData = params.data ? JSON.parse(params.data) : {};

    if (action === "submitDonation") {
      var record = submitDonationRecord(rawData);
      responseData = { success: true, id: record.id, record: record };
    } else if (action === "updateDonation") {
      var updated = updateDonationRecord(rawData);
      responseData = { success: true, record: updated };
    } else if (action === "deleteDonation") {
      deleteDonationRecord(params.id);
      responseData = { success: true };
    } else if (action === "saveSettings") {
      saveSettingsToSheet(rawData);
      responseData = { success: true };
    } else {
      responseData = { success: false, error: "Unknown action" };
    }
  } catch (err) {
    responseData = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ensure Sheets & Columns Exist
 */
function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === SHEET_DONATIONS_NAME) {
      sheet.appendRow([
        "ID",
        "Timestamp",
        "Date",
        "Donor Name",
        "Mobile",
        "Amount",
        "Category",
        "UTR Number",
        "Screenshot URL",
        "Status",
        "Admin Notes",
        "Is Anonymous",
        "Prayer Message"
      ]);
      sheet.getRange("A1:M1").setFontWeight("bold").setBackground("#FFE082");
      sheet.setFrozenRows(1);
    } else if (sheetName === SHEET_SETTINGS_NAME) {
      sheet.appendRow(["Key", "Value"]);
      sheet.getRange("A1:B1").setFontWeight("bold").setBackground("#FFE082");
      sheet.appendRow(["upiId", "gajakarna@upi"]);
      sheet.appendRow(["payeeName", "Team Gajakarna"]);
      sheet.appendRow(["defaultNote", "Ganesh Utsav 2026 Donation"]);
      sheet.appendRow(["customQrUrl", ""]);
    }
  }
  return sheet;
}

/**
 * Get or Create Google Drive Folder for Proof Uploads
 */
function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  var folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

/**
 * Save Screenshot image to Drive
 */
function saveImageToDrive(base64Data, filename) {
  if (!base64Data || !base64Data.startsWith("data:image")) {
    return "";
  }
  try {
    var parts = base64Data.split(",");
    var contentType = parts[0].split(";")[0].replace("data:", "");
    var decoded = Utilities.base64Decode(parts[1]);
    var blob = Utilities.newBlob(decoded, contentType, filename);

    var folder = getOrCreateFolder();
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log("Drive upload error: " + e.toString());
    return "";
  }
}

/**
 * Submit New Donation Record
 */
function submitDonationRecord(data) {
  var sheet = getOrCreateSheet(SHEET_DONATIONS_NAME);
  var lastRow = sheet.getLastRow();
  var count = lastRow; // row 1 is header
  var formattedId = "TG-26-" + Utilities.formatString("%03d", count);

  var screenshotUrl = "";
  if (data.screenshot) {
    screenshotUrl = saveImageToDrive(data.screenshot, formattedId + "_" + (data.utr || "receipt") + ".jpg");
  }

  var timestamp = new Date();
  var dateStr = data.date || Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  var status = "Pending";
  var notes = "Awaiting bank statement confirmation";

  sheet.appendRow([
    formattedId,
    timestamp.toISOString(),
    dateStr,
    data.name || "",
    "'" + (data.mobile || ""),
    Number(data.amount || 0),
    data.category || "General Utsav",
    "'" + (data.utr || ""),
    screenshotUrl,
    status,
    notes,
    data.isAnonymous ? "TRUE" : "FALSE",
    data.message || ""
  ]);

  return {
    id: formattedId,
    name: data.name,
    mobile: data.mobile,
    amount: Number(data.amount),
    category: data.category,
    utr: data.utr,
    date: dateStr,
    screenshot: screenshotUrl,
    status: status,
    notes: notes,
    isAnonymous: Boolean(data.isAnonymous)
  };
}

/**
 * Fetch All Donations
 */
function getAllDonations() {
  var sheet = getOrCreateSheet(SHEET_DONATIONS_NAME);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    result.push({
      id: String(row[0]),
      timestamp: String(row[1]),
      date: String(row[2]),
      name: String(row[3]),
      mobile: String(row[4]).replace(/'/g, ""),
      amount: Number(row[5]),
      category: String(row[6]),
      utr: String(row[7]).replace(/'/g, ""),
      screenshot: String(row[8]),
      status: String(row[9]),
      notes: String(row[10]),
      isAnonymous: String(row[11]).toUpperCase() === "TRUE",
      message: String(row[12])
    });
  }
  return result.reverse(); // Newest first
}

/**
 * Update Donation Record
 */
function updateDonationRecord(record) {
  var sheet = getOrCreateSheet(SHEET_DONATIONS_NAME);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(record.id)) {
      var rowIdx = i + 1;
      if (record.name !== undefined) sheet.getRange(rowIdx, 4).setValue(record.name);
      if (record.mobile !== undefined) sheet.getRange(rowIdx, 5).setValue("'" + record.mobile);
      if (record.amount !== undefined) sheet.getRange(rowIdx, 6).setValue(Number(record.amount));
      if (record.category !== undefined) sheet.getRange(rowIdx, 7).setValue(record.category);
      if (record.utr !== undefined) sheet.getRange(rowIdx, 8).setValue("'" + record.utr);
      if (record.status !== undefined) sheet.getRange(rowIdx, 10).setValue(record.status);
      if (record.notes !== undefined) sheet.getRange(rowIdx, 11).setValue(record.notes);
      return record;
    }
  }
  throw new Error("Record ID not found: " + record.id);
}

/**
 * Delete Donation Record
 */
function deleteDonationRecord(id) {
  var sheet = getOrCreateSheet(SHEET_DONATIONS_NAME);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  throw new Error("Record ID not found: " + id);
}

/**
 * Get Public Stats (Safe for Public Donor Wall)
 */
function getPublicDonorWallData() {
  var all = getAllDonations();
  var verified = all.filter(function(d) { return d.status === "Verified"; });
  var totalSum = verified.reduce(function(acc, curr) { return acc + Number(curr.amount || 0); }, 0);

  var publicList = verified.map(function(d) {
    return {
      name: d.isAnonymous ? "Anonymous Devotee" : d.name,
      amount: d.amount,
      category: d.category,
      date: d.date.split(" ")[0]
    };
  });

  return {
    totalSum: totalSum,
    verifiedCount: verified.length,
    donors: publicList
  };
}

/**
 * Settings Get / Save
 */
function getSettingsFromSheet() {
  var sheet = getOrCreateSheet(SHEET_SETTINGS_NAME);
  var data = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }
  return settings;
}

function saveSettingsToSheet(newSettings) {
  var sheet = getOrCreateSheet(SHEET_SETTINGS_NAME);
  var data = sheet.getDataRange().getValues();

  for (var key in newSettings) {
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(newSettings[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, newSettings[key]]);
    }
  }
  return true;
}
