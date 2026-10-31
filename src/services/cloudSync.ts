// Cross-Device Cloud Sync & User Login Logging Service for English Partner
// Google Sheets + Apps Script Backend (Zero Cost, No Server Required)

export interface UserSyncPayload {
  username: string; // Strictly case-sensitive
  completedSentenceIds: number[];
  bookmarkedSentenceIds: number[];
  favoriteWordIds: number[];
  sentencePage: number;
  vocabRange: { start: number; end: number };
  theme: 'dark' | 'light';
  deviceInfo?: string;
  action?: 'LOGIN' | 'SYNC' | 'LOGOUT';
  lastUpdated: string;
}

export interface LoginLogEntry {
  timestamp: string;
  username: string;
  action: string;
  device: string;
  completedCount: number;
  currentPage: number;
}

const LOCAL_STORAGE_USERNAME_KEY = 'ep_current_username';
const LOCAL_STORAGE_ENDPOINT_KEY = 'ep_custom_sync_endpoint';
const LOCAL_STORAGE_SYNC_CACHE_KEY = 'ep_last_cloud_sync_time';

/**
 * Detect Device and Browser Info (e.g. "Windows PC - Chrome" or "Android Phone - Chrome")
 */
export function getDeviceInfo(): string {
  if (typeof window === 'undefined' || !navigator) return 'Web Browser';
  const ua = navigator.userAgent;
  let device = 'PC';
  if (/Android/i.test(ua)) device = 'Android Phone';
  else if (/iPhone/i.test(ua)) device = 'iPhone';
  else if (/iPad/i.test(ua)) device = 'iPad';
  else if (/Macintosh/i.test(ua)) device = 'Mac';
  else if (/Windows/i.test(ua)) device = 'Windows PC';
  else if (/Linux/i.test(ua)) device = 'Linux PC';

  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  return `${device} (${browser})`;
}

export const DEFAULT_GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwAvFy-3DlVjXW9p9h5qSwCbG06j5GVe38CBzCqM2az9tm2nRQ9I4Da4k36Na2TbD7k/exec';

/**
 * Returns currently saved case-sensitive username
 */
export function getStoredUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY);
}

/**
 * Stores case-sensitive username in localStorage
 */
export function setStoredUsername(username: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = username.trim();
  if (trimmed) {
    localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY, trimmed);
  } else {
    localStorage.removeItem(LOCAL_STORAGE_USERNAME_KEY);
  }
}

/**
 * Removes username (Logout)
 */
export function clearStoredUsername(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_USERNAME_KEY);
}

/**
 * Returns custom endpoint URL if configured by user, or default live endpoint
 */
export function getCustomEndpointUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_GOOGLE_SCRIPT_URL;
  return localStorage.getItem(LOCAL_STORAGE_ENDPOINT_KEY) || DEFAULT_GOOGLE_SCRIPT_URL;
}

/**
 * Saves custom Google Apps Script endpoint URL
 */
export function setCustomEndpointUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim();
  if (trimmed) {
    localStorage.setItem(LOCAL_STORAGE_ENDPOINT_KEY, trimmed);
  } else {
    localStorage.removeItem(LOCAL_STORAGE_ENDPOINT_KEY);
  }
}

/**
 * Get last sync timestamp
 */
export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_STORAGE_SYNC_CACHE_KEY);
}

export function setLastSyncTime(timeStr: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_SYNC_CACHE_KEY, timeStr);
}

/**
 * Fetch progress from Cloud by case-sensitive username
 */
export async function fetchCloudProgress(
  username: string
): Promise<Partial<UserSyncPayload> | null> {
  const cleanUsername = username.trim();
  if (!cleanUsername) return null;

  const endpoint = getCustomEndpointUrl();

  if (endpoint) {
    try {
      const gasUrl = `${endpoint}${
        endpoint.includes('?') ? '&' : '?'
      }action=get&username=${encodeURIComponent(cleanUsername)}`;

      const res = await fetch(gasUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        if (json && (json.success || json.status === 'success') && json.data) {
          setLastSyncTime(new Date().toLocaleTimeString());
          return json.data;
        } else if (json && json.username === cleanUsername) {
          setLastSyncTime(new Date().toLocaleTimeString());
          return json;
        }
      }
    } catch (err) {
      console.warn('Custom cloud fetch warning:', err);
    }
  }

  // Local fallback
  try {
    const backupNamespace = localStorage.getItem(`ep_cloud_mock_${cleanUsername}`);
    if (backupNamespace) {
      return JSON.parse(backupNamespace);
    }
  } catch {}

  return null;
}

/**
 * Push progress & log login event to Google Sheets Database
 */
export async function pushCloudProgress(payload: UserSyncPayload): Promise<boolean> {
  const cleanUsername = payload.username.trim();
  if (!cleanUsername) return false;

  const enrichedPayload: UserSyncPayload = {
    ...payload,
    deviceInfo: payload.deviceInfo || getDeviceInfo(),
    action: payload.action || 'SYNC',
    lastUpdated: new Date().toISOString(),
  };

  // Cache locally
  try {
    localStorage.setItem(`ep_cloud_mock_${cleanUsername}`, JSON.stringify(enrichedPayload));
  } catch {}

  const endpoint = getCustomEndpointUrl();
  if (!endpoint) {
    setLastSyncTime(new Date().toLocaleTimeString());
    return true;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: enrichedPayload.action || 'save',
        ...enrichedPayload,
      }),
    });

    if (res.ok) {
      setLastSyncTime(new Date().toLocaleTimeString());
      return true;
    }
  } catch (err) {
    console.warn('Cloud sync push warning (offline or CORS):', err);
  }

  return false;
}

/**
 * Fetch recent Login Logs from Google Sheets
 */
export async function fetchLoginLogs(): Promise<LoginLogEntry[]> {
  const endpoint = getCustomEndpointUrl();
  if (!endpoint) return [];

  try {
    const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}action=get_logs`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.logs)) {
        return json.logs;
      }
    }
  } catch (err) {
    console.warn('Could not fetch login logs:', err);
  }
  return [];
}

/**
 * Comprehensive Google Apps Script Template
 * Creates 2 Sheets: "Users" (User Progress) and "LoginLogs" (Audit Log)
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// ==============================================================================
// ENGLISH PARTNER - GOOGLE SHEETS CLOUD DATABASE & LOGIN LOG SYSTEM
// ==============================================================================
// Created for Md. Rafijur Rahman (Zuboraj)
// Automatically creates & manages 2 sheets:
// 1. "Users"     -> Stores latest progress per case-sensitive username
// 2. "LoginLogs" -> Keeps a real-time audit trail of every login & device sync

function doGet(e) {
  var action = e.parameter.action;
  var username = e.parameter.username;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  initDatabase(ss);
  
  // 1. GET User Progress
  if (action === "get" && username) {
    var usersSheet = ss.getSheetByName("Users");
    var data = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      // Strictly CASE-SENSITIVE username comparison
      if (String(data[i][0]) === String(username)) {
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          data: JSON.parse(data[i][1]),
          lastActive: data[i][2],
          device: data[i][3]
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "User not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 2. GET Login Logs (Latest 50 entries)
  if (action === "get_logs") {
    var logSheet = ss.getSheetByName("LoginLogs");
    var logData = logSheet.getDataRange().getValues();
    var logs = [];
    var startIdx = Math.max(1, logData.length - 50);
    
    for (var j = logData.length - 1; j >= startIdx; j--) {
      logs.push({
        timestamp: logData[j][0],
        username: logData[j][1],
        action: logData[j][2],
        device: logData[j][3],
        completedCount: logData[j][4],
        currentPage: logData[j][5]
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, logs: logs }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "ready", system: "English Partner DB" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var username = payload.username;
    if (!username) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Username required" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initDatabase(ss);
    
    var usersSheet = ss.getSheetByName("Users");
    var logsSheet = ss.getSheetByName("LoginLogs");
    
    var nowStr = Utilities.formatDate(new Date(), "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss");
    var device = payload.deviceInfo || "Unknown Device";
    var actionType = payload.action || "SYNC";
    var completedCount = payload.completedSentenceIds ? payload.completedSentenceIds.length : 0;
    var currentPage = payload.sentencePage || 1;
    
    // --- 1. Update or Insert in "Users" Sheet ---
    var data = usersSheet.getDataRange().getValues();
    var rowIndex = -1;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(username)) {
        rowIndex = i + 1; // 1-indexed for sheet
        break;
      }
    }
    
    var jsonPayload = JSON.stringify(payload);
    
    if (rowIndex > 0) {
      usersSheet.getRange(rowIndex, 2).setValue(jsonPayload);
      usersSheet.getRange(rowIndex, 3).setValue(nowStr);
      usersSheet.getRange(rowIndex, 4).setValue(device);
      usersSheet.getRange(rowIndex, 5).setValue(completedCount);
      usersSheet.getRange(rowIndex, 6).setValue(currentPage);
    } else {
      usersSheet.appendRow([username, jsonPayload, nowStr, device, completedCount, currentPage]);
    }
    
    // --- 2. Log to "LoginLogs" Sheet ---
    logsSheet.appendRow([nowStr, username, actionType, device, completedCount, currentPage]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      username: username,
      action: actionType,
      updated: nowStr
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Automatically create and format sheets if they don't exist
function initDatabase(ss) {
  var usersSheet = ss.getSheetByName("Users");
  if (!usersSheet) {
    usersSheet = ss.insertSheet("Users");
    usersSheet.appendRow(["Username", "DataJSON", "LastActive", "Device", "CompletedSentences", "CurrentPage"]);
    usersSheet.getRange(1, 1, 1, 6).setBackground("#0284c7").setFontColor("#ffffff").setFontWeight("bold");
    usersSheet.setFrozenRows(1);
  }
  
  var logsSheet = ss.getSheetByName("LoginLogs");
  if (!logsSheet) {
    logsSheet = ss.insertSheet("LoginLogs");
    logsSheet.appendRow(["Timestamp", "Username", "Action", "Device", "CompletedSentences", "CurrentPage"]);
    logsSheet.getRange(1, 1, 1, 6).setBackground("#059669").setFontColor("#ffffff").setFontWeight("bold");
    logsSheet.setFrozenRows(1);
  }
}
`;
