/**
 * ==============================================================================
 * ENGLISH PARTNER - STANDALONE CASE-SENSITIVE USERNAME & CROSS-DEVICE SYNC SNIPPET
 * ==============================================================================
 * 
 * Works with 100% free Google Account (Google Sheets / Google Apps Script)
 * Zero backend server or database account required!
 * 
 * Instructions:
 * 1. Place this script tag in your HTML file before </body>:
 *    <script src="sync-vanilla.js"></script>
 * 
 * 2. Set your free Google Apps Script Web App URL below:
 */

const GOOGLE_SCRIPT_WEBAPP_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE";

// 1. Get or Set Case-Sensitive Username
function getSavedUsername() {
  return localStorage.getItem("ep_username");
}

function setSavedUsername(username) {
  if (username && username.trim()) {
    // Strictly preserve case ('zuboraj' != 'Zuboraj')
    localStorage.setItem("ep_username", username.trim());
  } else {
    localStorage.removeItem("ep_username");
  }
}

// 2. Fetch Progress from Cloud (Google Sheet)
async function fetchCloudProgress(username) {
  if (!username || !GOOGLE_SCRIPT_WEBAPP_URL) return null;
  try {
    const url = `${GOOGLE_SCRIPT_WEBAPP_URL}?action=get&username=${encodeURIComponent(username)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json && json.success && json.data) {
      console.log("☁️ Cloud progress fetched successfully:", json.data);
      return json.data;
    }
  } catch (err) {
    console.warn("Could not fetch cloud progress:", err);
  }
  return null;
}

// 3. Save Progress to Cloud (Google Sheet)
async function saveCloudProgress(progressData) {
  const username = getSavedUsername();
  if (!username || !GOOGLE_SCRIPT_WEBAPP_URL) return false;

  const payload = {
    action: "save",
    username: username, // Strictly case-sensitive
    page: progressData.page || 1,
    completedSentenceIds: progressData.completedSentenceIds || [],
    vocabRange: progressData.vocabRange || { start: 1, end: 50 },
    quizScore: progressData.quizScore || 0,
    theme: progressData.theme || "dark",
    lastUpdated: new Date().toISOString()
  };

  // Cache locally first for instant offline capability
  localStorage.setItem("ep_local_cache", JSON.stringify(payload));

  try {
    const res = await fetch(GOOGLE_SCRIPT_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    console.log("☁️ Cloud progress saved successfully:", result);
    return true;
  } catch (err) {
    console.warn("Cloud save failed (will sync later):", err);
    return false;
  }
}

// 4. Modal Prompt on First Visit
function initUserSyncOnLoad(onUserReady) {
  let user = getSavedUsername();
  if (!user) {
    const entered = prompt("আপনার নাম / ইউজারনেম লিখুন (e.g., zuboraj) পিসি ও ফোনে প্রগ্রেস সিঙ্ক করতে:\n(সতর্কতা: এটি কেস-সেন্সিটিভ)");
    if (entered && entered.trim()) {
      user = entered.trim();
      setSavedUsername(user);
    }
  }

  if (user) {
    fetchCloudProgress(user).then((remoteData) => {
      if (remoteData && typeof onUserReady === "function") {
        onUserReady(remoteData);
      }
    });
  }
}
