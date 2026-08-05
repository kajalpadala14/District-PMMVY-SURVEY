const CONFIG = {
  SHEET_NAME: "SURVEY",
  DEFAULT_DISTRICT: "Dantewada",
  DEFAULT_STATE: "Chhattisgarh",
};

const ISSUE_COLUMNS = [
  { header: "MCP CARD MISSING", reason: "MCP Card Missing" },
  { header: "BANK ACCOUNT ISSUE", reason: "Bank Account Issue" },
  { header: "AADHAAR MISMATCH", reason: "Aadhaar Mismatch" },
  { header: "AADHAAR-BANK LINK", reason: "Aadhaar-Bank Link" },
  { header: "OTHER", reason: "Other / Document" },
];

function doGet(e) {
  try {
    const action = String((e.parameter && e.parameter.action) || "beneficiaries");

    if (action === "meta") {
      return jsonResponse({
        ok: true,
        data: {
          district: CONFIG.DEFAULT_DISTRICT,
          state: CONFIG.DEFAULT_STATE,
          asOf: Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, HH:mm 'IST'"),
        },
      });
    }

    if (action === "beneficiary") {
      const id = String((e.parameter && e.parameter.id) || "");
      const rows = getBeneficiaries_();
      const row = rows.find(function (item) {
        return item.id === id || item.appId === id;
      });
      return jsonResponse({ ok: true, data: row || null });
    }

    return jsonResponse({
      ok: true,
      data: getBeneficiaries_(),
      meta: {
        count: getBeneficiaries_().length,
        asOf: Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, HH:mm 'IST'"),
      },
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");

    if (body.action === "updateSurvey") {
      return jsonResponse({
        ok: true,
        data: updateSurvey_(body),
      });
    }

    return jsonResponse({
      ok: false,
      error: "Unknown action. Use action=updateSurvey.",
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
}

function getBeneficiaries_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(normalizeHeader_);
  const dataRows = values.slice(1);

  return dataRows
    .filter(function (row) {
      return row.some(function (cell) {
        return String(cell).trim() !== "";
      });
    })
    .map(function (row, index) {
      const serial = getCell_(row, headers, ["S.NO", "S NO", "SNO"]) || String(index + 1);
      const block = getCell_(row, headers, ["BLOCK"]) || CONFIG.DEFAULT_DISTRICT;
      const gp = getCell_(row, headers, ["GRAM PANCHAYAT", "GP"]);
      const village = getCell_(row, headers, ["VILLAGE"]);
      const name = getCell_(row, headers, ["MEMBER", "NAME", "BENEFICIARY NAME"]);
      const age = getCell_(row, headers, ["AGE"]);
      const gender = getCell_(row, headers, ["GENDER"]);
      const guardian = getCell_(row, headers, ["FATHER'S/HUSBAND'S NAME", "FATHERS/HUSBANDS NAME", "GUARDIAN"]);
      const remark = getCell_(row, headers, ["REMARK", "REMARKS"]);
      const reasons = getReasons_(row, headers);
      const primaryReason = reasons[0] || "Other / Document";
      const completed = reasons.length > 0 || remark !== "";

      return {
        id: "BEN" + pad_(serial, 5),
        appId: "MVY/" + String(block).slice(0, 3).toUpperCase() + "/" + pad_(serial, 5),
        serialNo: serial,
        name: name || "Unnamed Beneficiary",
        age: age,
        gender: gender,
        guardian: guardian,
        mobile: getCell_(row, headers, ["MOBILE", "MOBILE NO", "PHONE"]) || "",
        aadhaar: maskAadhaar_(getCell_(row, headers, ["AADHAAR", "AADHAR", "AADHAAR NO"])),
        village: village,
        gp: gp,
        block: stripHindi_(block),
        rawBlock: block,
        reason: primaryReason,
        reasons: reasons,
        caseStatus: completed ? "Pending" : "Pending",
        surveyStatus: completed ? "Completed" : "Pending",
        officer: getCell_(row, headers, ["SURVEY OFFICER", "OFFICER", "ASSIGNED OFFICER"]) || "Unassigned",
        pendingDays: Number(getCell_(row, headers, ["PENDING DAYS", "PENDING SINCE"])) || 0,
        lastSurvey: getCell_(row, headers, ["LAST SURVEY", "SURVEY DATE"]) || null,
        priority: getPriority_(Number(getCell_(row, headers, ["PENDING DAYS", "PENDING SINCE"])) || 0, reasons.length),
        remark: remark,
        issueFlags: getIssueFlags_(row, headers),
      };
    });
}

function updateSurvey_(body) {
  const id = String(body.id || body.appId || "");
  if (!id) throw new Error("id or appId is required.");

  const sheet = getSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map(normalizeHeader_);
  const serialIndex = findHeader_(headers, ["S.NO", "S NO", "SNO"]);
  const targetRowIndex = values.findIndex(function (row, index) {
    if (index === 0) return false;
    const serial = serialIndex >= 0 ? row[serialIndex] : String(index);
    return id === "BEN" + pad_(serial, 5) || id.endsWith("/" + pad_(serial, 5)) || id === String(serial);
  });

  if (targetRowIndex < 1) throw new Error("Beneficiary not found: " + id);

  const selectedReasons = Array.isArray(body.reasons) ? body.reasons : [];
  ISSUE_COLUMNS.forEach(function (issue) {
    const column = findHeader_(headers, [issue.header]);
    if (column >= 0) {
      sheet.getRange(targetRowIndex + 1, column + 1).setValue(selectedReasons.indexOf(issue.reason) >= 0 ? "YES" : "");
    }
  });

  const remarkColumn = findHeader_(headers, ["REMARK", "REMARKS"]);
  if (remarkColumn >= 0 && body.remark !== undefined) {
    sheet.getRange(targetRowIndex + 1, remarkColumn + 1).setValue(body.remark);
  }

  return getBeneficiaries_()[targetRowIndex - 1];
}

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error("Sheet not found: " + CONFIG.SHEET_NAME);
  return sheet;
}

function getReasons_(row, headers) {
  return ISSUE_COLUMNS.filter(function (issue) {
    const value = getCell_(row, headers, [issue.header]);
    return isMarked_(value);
  }).map(function (issue) {
    return issue.reason;
  });
}

function getIssueFlags_(row, headers) {
  const flags = {};
  ISSUE_COLUMNS.forEach(function (issue) {
    flags[issue.reason] = isMarked_(getCell_(row, headers, [issue.header]));
  });
  return flags;
}

function getCell_(row, headers, names) {
  const index = findHeader_(headers, names);
  return index >= 0 ? String(row[index] || "").trim() : "";
}

function findHeader_(headers, names) {
  const normalized = names.map(normalizeHeader_);
  return headers.findIndex(function (header) {
    return normalized.indexOf(header) >= 0;
  });
}

function normalizeHeader_(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function isMarked_(value) {
  const text = String(value || "").trim().toUpperCase();
  return ["YES", "Y", "TRUE", "1", "DONE", "PENDING", "CHECKED", "✓"].indexOf(text) >= 0;
}

function maskAadhaar_(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  return "XXXX XXXX " + digits.slice(-4);
}

function getPriority_(pendingDays, issueCount) {
  if (pendingDays >= 30 || issueCount >= 3) return "High";
  if (pendingDays >= 15 || issueCount >= 2) return "Medium";
  return "Low";
}

function stripHindi_(value) {
  return String(value || "").replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function pad_(value, length) {
  const text = String(value || "").replace(/\D/g, "") || "0";
  return text.padStart(length, "0");
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
