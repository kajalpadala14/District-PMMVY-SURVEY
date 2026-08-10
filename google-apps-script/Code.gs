const CONFIG = {
  SHEET_NAME: "SURVEY",
  TIMELINE_SHEET_NAME: "TIMELINE",
  CACHE_SECONDS: 600,
  CACHE_CHUNK_SIZE: 90000,
  DEFAULT_DISTRICT: "",
  DEFAULT_STATE: "",
};

const ISSUE_COLUMNS = [
  { header: "MCP CARD MISSING", reason: "MCP Card Missing" },
  { header: "BANK ACCOUNT ISSUE", reason: "Bank Account Issue" },
  { header: "AADHAAR MISMATCH", reason: "Aadhaar Mismatch" },
  { header: "AADHAAR-BANK LINK", reason: "Aadhaar-Bank Link" },
  { header: "OTHER", reason: "Other / Document" },
];

const PROJECT_ALIASES = {
  KATAKALYAN: "Katekalyan",
};

function doGet(e) {
  try {
    const action = String((e.parameter && e.parameter.action) || "beneficiaries");
    const refresh = String((e.parameter && e.parameter.refresh) || "") === "1";

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

    if (action === "timeline") {
      const id = String((e.parameter && e.parameter.id) || "");
      return jsonResponse({
        ok: true,
        data: getTimeline_(id),
      });
    }

    if (action === "beneficiaries" && !refresh) {
      const cached = getLargeCache_("beneficiaries:v3");
      if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }

    const beneficiaries = getBeneficiaries_();
    const responseText = JSON.stringify({
      ok: true,
      data: beneficiaries,
      meta: {
        count: beneficiaries.length,
        cached: false,
        asOf: Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, HH:mm 'IST'"),
      },
    });
    putLargeCache_("beneficiaries:v3", responseText, CONFIG.CACHE_SECONDS);
    return ContentService.createTextOutput(responseText).setMimeType(ContentService.MimeType.JSON);
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
      clearLargeCache_("beneficiaries:v3");
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
      const project = normalizeProject_(getCell_(row, headers, ["PROJECT", "PROJECT NAME", "PARIYOJANA", "परियोजना"]));
      const block = getCell_(row, headers, ["BLOCK"]);
      const gp = getCell_(row, headers, ["GRAM PANCHAYAT", "GP"]);
      const village = getCell_(row, headers, ["VILLAGE"]);
      const name = getCell_(row, headers, ["MEMBER", "NAME", "BENEFICIARY NAME"]);
      const remark = getCell_(row, headers, ["REMARK", "REMARKS"]);
      const savedSurveyStatus = getCell_(row, headers, ["SURVEY STATUS"]);
      const savedCaseStatus = getCell_(row, headers, ["CASE STATUS"]);
      const registrationStatus = getCell_(row, headers, ["REGISTRATION STATUS", "BENEFICIARY REGISTERED"]);
      const reasonKnown = getCell_(row, headers, ["REASON KNOWN"]);
      const registrationReason = getCell_(row, headers, ["REGISTRATION REASON", "REASON"]);
      const selectedIssue = getCell_(row, headers, ["ISSUE SELECTED", "ISSUE"]);
      const pendingReasonText = getCell_(row, headers, ["PENDING REASON", "PENDING REASONS"]);
      const reasons = unique_(getReasons_(row, headers).concat(parseReasons_(pendingReasonText)).concat(parseReasons_(selectedIssue)));
      const primaryReason = reasons[0] || "";
      const hasRegistrationWorkflow = Boolean(registrationStatus || reasonKnown || registrationReason || selectedIssue);
      const surveyStatus =
        savedSurveyStatus && (savedSurveyStatus !== "Completed" || hasRegistrationWorkflow || savedCaseStatus === "Resolved")
          ? savedSurveyStatus
          : "Pending";

      return {
        id: "BEN" + pad_(serial, 5),
        appId: "MVY/" + String(block).slice(0, 3).toUpperCase() + "/" + pad_(serial, 5),
        project: project,
        name: name,
        mobile: getCell_(row, headers, ["MOBILE", "MOBILE NO", "PHONE"]) || "",
        aadhaar: maskAadhaar_(getCell_(row, headers, ["AADHAAR", "AADHAR", "AADHAAR NO"])),
        village: village,
        gp: gp,
        block: stripHindi_(block),
        reason: primaryReason,
        reasons: reasons,
        caseStatus: savedCaseStatus || "Pending",
        surveyStatus: surveyStatus,
        registrationStatus: registrationStatus,
        reasonKnown: reasonKnown,
        registrationReason: registrationReason,
        issue: selectedIssue,
        officer: getCell_(row, headers, ["SURVEY OFFICER", "OFFICER", "ASSIGNED OFFICER"]),
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

  const before = getBeneficiaries_()[targetRowIndex - 1];

  const selectedReasons = normalizeReasons_(body.reasons || body.issue || body.reason || []);
  ISSUE_COLUMNS.forEach(function (issue) {
    const column = ensureHeader_(sheet, headers, issue.header);
    sheet.getRange(targetRowIndex + 1, column + 1).setValue(selectedReasons.indexOf(issue.reason) >= 0 ? "NO" : "YES");
  });

  const pendingReasonColumn = ensureHeader_(sheet, headers, "PENDING REASON");
  sheet.getRange(targetRowIndex + 1, pendingReasonColumn + 1).setValue(selectedReasons.join(", "));

  if (body.registrationStatus !== undefined) {
    const registrationColumn = ensureHeader_(sheet, headers, "REGISTRATION STATUS");
    sheet.getRange(targetRowIndex + 1, registrationColumn + 1).setValue(body.registrationStatus);
  }

  if (body.reasonKnown !== undefined) {
    const reasonKnownColumn = ensureHeader_(sheet, headers, "REASON KNOWN");
    sheet.getRange(targetRowIndex + 1, reasonKnownColumn + 1).setValue(body.reasonKnown);
  }

  if (body.registrationReason !== undefined) {
    const registrationReasonColumn = ensureHeader_(sheet, headers, "REGISTRATION REASON");
    sheet.getRange(targetRowIndex + 1, registrationReasonColumn + 1).setValue(body.registrationReason);
  }

  if (body.issue !== undefined) {
    const issueColumn = ensureHeader_(sheet, headers, "ISSUE SELECTED");
    sheet.getRange(targetRowIndex + 1, issueColumn + 1).setValue(normalizeIssueText_(body.issue));
  }

  if (body.remark !== undefined) {
    const remarkColumn = ensureHeader_(sheet, headers, "REMARK");
    sheet.getRange(targetRowIndex + 1, remarkColumn + 1).setValue(body.remark);
  }

  if (body.officer !== undefined) {
    const officerColumn = ensureHeader_(sheet, headers, "SURVEY OFFICER");
    sheet.getRange(targetRowIndex + 1, officerColumn + 1).setValue(body.officer);
  }

  if (body.surveyDate !== undefined) {
    const surveyDateColumn = ensureHeader_(sheet, headers, "SURVEY DATE");
    sheet.getRange(targetRowIndex + 1, surveyDateColumn + 1).setValue(body.surveyDate);
  }

  const surveyStatusColumn = ensureHeader_(sheet, headers, "SURVEY STATUS");
  sheet.getRange(targetRowIndex + 1, surveyStatusColumn + 1).setValue(body.surveyStatus || "Completed");

  if (body.caseStatus !== undefined) {
    const caseStatusColumn = ensureHeader_(sheet, headers, "CASE STATUS");
    sheet.getRange(targetRowIndex + 1, caseStatusColumn + 1).setValue(body.caseStatus);
  }

  const updated = getBeneficiaries_()[targetRowIndex - 1];
  buildTimelineEvents_(before, updated, body).forEach(function (event) {
    appendTimeline_(updated, event.action, event.detail, body);
  });
  return updated;
}

function getTimeline_(id) {
  if (!id) return [];

  const sheet = getTimelineSheet_(false);
  if (!sheet) return [];

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(normalizeHeader_);
  return values
    .slice(1)
    .filter(function (row) {
      const beneficiaryId = getCell_(row, headers, ["BENEFICIARY ID"]);
      const appId = getCell_(row, headers, ["APPLICATION ID"]);
      return beneficiaryId === id || appId === id;
    })
    .map(function (row) {
      return {
        date: getCell_(row, headers, ["DATE"]),
        time: getCell_(row, headers, ["TIME"]),
        text: getCell_(row, headers, ["EVENT"]),
        detail: getCell_(row, headers, ["DETAIL"]),
        officer: getCell_(row, headers, ["OFFICER"]),
        status: getCell_(row, headers, ["STATUS", "CURRENT STATUS"]),
      };
    })
    .filter(function (item) {
      return Boolean(
        String(item.date || "").trim() ||
          String(item.time || "").trim() ||
          String(item.text || "").trim() ||
          String(item.detail || "").trim() ||
          String(item.status || "").trim(),
      );
    })
    .sort(function (a, b) {
      return String(a.time || a.date).localeCompare(String(b.time || b.date));
    });
}

function clearTimelineForChadni() {
  return clearTimelineForBeneficiary_("Chadni");
}

function clearTimelineForBeneficiary_(query) {
  const sheet = getTimelineSheet_(false);
  if (!sheet) return 0;

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return 0;

  const headers = values[0].map(normalizeHeader_);
  const text = String(query || "").trim().toUpperCase();
  if (!text) return 0;

  let deleted = 0;
  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    const row = values[rowIndex];
    const beneficiaryId = getCell_(row, headers, ["BENEFICIARY ID"]);
    const appId = getCell_(row, headers, ["APPLICATION ID"]);
    const name = getCell_(row, headers, ["BENEFICIARY NAME", "NAME"]);
    const haystack = [beneficiaryId, appId, name].join(" ").toUpperCase();
    if (haystack.indexOf(text) >= 0) {
      sheet.deleteRow(rowIndex + 1);
      deleted += 1;
    }
  }
  return deleted;
}

function appendTimeline_(beneficiary, text, detail, body) {
  const sheet = getTimelineSheet_(true);
  ensureTimelineHeaders_(sheet);
  const now = new Date();
  const date = Utilities.formatDate(now, "Asia/Kolkata", "yyyy-MM-dd");
  const time = Utilities.formatDate(now, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([
    time,
    date,
    beneficiary.id,
    beneficiary.appId,
    beneficiary.name,
    text,
    detail || beneficiary.remark || "",
    beneficiary.officer || "",
    beneficiary.surveyStatus || "",
  ]);
}

function buildTimelineEvents_(before, updated, body) {
  const events = [];
  const isFirstSubmission = !before || before.surveyStatus === "Pending";

  if (!hasTimeline_(updated.id, updated.appId)) {
    events.push({ action: "Survey Created", detail: "Record opened for field verification" });
  }

  if (!before || String(before.registrationStatus || "") !== String(updated.registrationStatus || "")) {
    events.push({ action: "Registration Verified = " + (updated.registrationStatus || "Not set"), detail: "" });
  }

  if (before && String(before.surveyStatus || "") !== String(updated.surveyStatus || "")) {
    events.push({ action: "Status changed to " + updated.surveyStatus, detail: "" });
  }

  if (updated.surveyStatus === "Reason Pending" && (!before || String(before.surveyStatus || "") !== "Reason Pending")) {
    events.push({ action: "Status = Reason Pending", detail: "Reason and issue can be updated later" });
  }

  if (!before || String(before.registrationReason || "") !== String(updated.registrationReason || "")) {
    if (updated.registrationReason) events.push({ action: "Reason Added", detail: updated.registrationReason });
  }

  if (!before || String(before.issue || "") !== String(updated.issue || "")) {
    if (updated.issue) events.push({ action: "Issue Added", detail: updated.issue });
  }

  if (before && String(before.remark || "") !== String(updated.remark || "")) {
    events.push({ action: "Remarks Updated", detail: updated.remark || "" });
  }

  if (body.caseStatus === "Resolved") {
    events.push({ action: "Survey Completed", detail: "Case marked resolved" });
  } else {
    events.push({ action: isFirstSubmission ? "Survey Submitted" : "Survey Updated", detail: "" });
  }

  return events;
}

function getTimelineSheet_(createIfMissing) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.TIMELINE_SHEET_NAME);
  if (!sheet && createIfMissing) {
    sheet = spreadsheet.insertSheet(CONFIG.TIMELINE_SHEET_NAME);
    sheet.appendRow(["TIME", "DATE", "BENEFICIARY ID", "APPLICATION ID", "BENEFICIARY NAME", "EVENT", "DETAIL", "OFFICER", "STATUS"]);
  }
  return sheet;
}

function ensureTimelineHeaders_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  if (!values.length) {
    sheet.appendRow(["TIME", "DATE", "BENEFICIARY ID", "APPLICATION ID", "BENEFICIARY NAME", "EVENT", "DETAIL", "OFFICER", "STATUS"]);
    return;
  }

  const headers = values[0].map(normalizeHeader_);
  ["TIME", "DATE", "BENEFICIARY ID", "APPLICATION ID", "BENEFICIARY NAME", "EVENT", "DETAIL", "OFFICER", "STATUS"].forEach(function (header) {
    ensureHeader_(sheet, headers, header);
  });
}

function hasTimeline_(beneficiaryId, appId) {
  const sheet = getTimelineSheet_(false);
  if (!sheet) return false;

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return false;

  const headers = values[0].map(normalizeHeader_);
  return values.slice(1).some(function (row) {
    const savedBeneficiaryId = getCell_(row, headers, ["BENEFICIARY ID"]);
    const savedAppId = getCell_(row, headers, ["APPLICATION ID"]);
    return savedBeneficiaryId === beneficiaryId || savedAppId === appId;
  });
}

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error("Sheet not found: " + CONFIG.SHEET_NAME);
  return sheet;
}

function getReasons_(row, headers) {
  return ISSUE_COLUMNS.filter(function (issue) {
    return isNo_(getCell_(row, headers, [issue.header]));
  }).map(function (issue) {
    return issue.reason;
  });
}

function parseReasons_(value) {
  return normalizeReasons_(
    String(value || "")
      .split(/[,;|]/)
      .map(function (item) {
        return item.trim();
      }),
  );
}

function normalizeReasons_(value) {
  const input = Array.isArray(value) ? value : [value];
  return unique_(
    input
      .map(function (item) {
        const text = String(item || "").trim().toUpperCase();
        if (text === "DOCUMENT MISSING" || text === "DOCUMENTS PENDING" || text === "OTHER") {
          return "Other / Document";
        }
        const match = ISSUE_COLUMNS.find(function (issue) {
          return issue.reason.toUpperCase() === text || issue.header.toUpperCase() === text;
        });
        return match ? match.reason : "";
      })
      .filter(Boolean),
  );
}

function unique_(values) {
  const seen = {};
  return values.filter(function (value) {
    if (seen[value]) return false;
    seen[value] = true;
    return true;
  });
}

function getIssueFlags_(row, headers) {
  const flags = {};

  ISSUE_COLUMNS.forEach(function (issue) {
    flags[issue.reason] = isNo_(getCell_(row, headers, [issue.header]));
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

function ensureHeader_(sheet, headers, name) {
  let index = findHeader_(headers, [name]);
  if (index >= 0) return index;

  index = headers.length;
  sheet.getRange(1, index + 1).setValue(name);
  headers.push(normalizeHeader_(name));
  return index;
}

function normalizeHeader_(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeProject_(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return PROJECT_ALIASES[text.toUpperCase()] || text;
}

function isMarked_(value) {
  const text = String(value || "").trim().toUpperCase();
  return ["YES", "Y", "TRUE", "1", "DONE", "PENDING", "CHECKED", "✓"].indexOf(text) >= 0;
}

function isNo_(value) {
  const text = String(value || "").trim().toUpperCase();
  return ["NO", "N", "FALSE", "0", "NAHI", "NAHIN", "NHI", "नहीं", "नही"].indexOf(text) >= 0;
}

function normalizeIssueText_(value) {
  if (Array.isArray(value)) {
    return unique_(
      value
        .map(function (item) {
          return normalizeIssueText_(item);
        })
        .filter(Boolean),
    ).join(", ");
  }

  const text = stripHindi_(String(value || "").replace(/[^\x00-\x7F]+/g, "")).trim();
  const upper = text.toUpperCase();
  if (upper === "DOCUMENT MISSING") return "Document Missing";
  if (upper === "OTHER") return "Other";

  const reasons = normalizeReasons_(value);
  if (reasons.length) {
    return reasons[0] === "Other / Document" ? "Document Missing" : reasons[0];
  }
  return text;
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

function getLargeCache_(key) {
  const cache = CacheService.getScriptCache();
  const metaText = cache.get(key + ":meta");
  if (!metaText) return "";

  try {
    const meta = JSON.parse(metaText);
    const chunkKeys = [];
    for (let i = 0; i < meta.chunks; i += 1) {
      chunkKeys.push(key + ":" + i);
    }
    const chunks = cache.getAll(chunkKeys);
    const text = chunkKeys.map(function (chunkKey) {
      return chunks[chunkKey] || "";
    }).join("");
    return text.length === meta.length ? text : "";
  } catch (err) {
    return "";
  }
}

function putLargeCache_(key, text, seconds) {
  const cache = CacheService.getScriptCache();
  const chunks = {};
  const chunkCount = Math.ceil(text.length / CONFIG.CACHE_CHUNK_SIZE);
  for (let i = 0; i < chunkCount; i += 1) {
    chunks[key + ":" + i] = text.slice(i * CONFIG.CACHE_CHUNK_SIZE, (i + 1) * CONFIG.CACHE_CHUNK_SIZE);
  }
  chunks[key + ":meta"] = JSON.stringify({
    chunks: chunkCount,
    length: text.length,
    cachedAt: Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, HH:mm 'IST'"),
  });
  cache.putAll(chunks, seconds);
}

function clearLargeCache_(key) {
  const cache = CacheService.getScriptCache();
  const metaText = cache.get(key + ":meta");
  if (!metaText) return;

  try {
    const meta = JSON.parse(metaText);
    const keys = [key + ":meta"];
    for (let i = 0; i < meta.chunks; i += 1) {
      keys.push(key + ":" + i);
    }
    cache.removeAll(keys);
  } catch (err) {
    cache.remove(key + ":meta");
  }
}
