// =============================================
//   BN Tiffin Ma — script.js
// =============================================

// ⚠️  CHANGE THIS TO YOUR DEPLOYED APPS SCRIPT URL
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwMY6Ed3a8eE2db_w2Hdd_XTmTMhsyiLX4o4fMAJigEhvU4n5XOh1tA5XldHrWAYWcG9Q/exec";

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

let membersData  = [];
let summaryCache = {};
let isAdmin      = false;
let refreshTimer = null;

// ── INIT ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  loadData();
  refreshTimer = setInterval(loadData, 30000); // auto-refresh every 30s
});

// ── NAVIGATION ────────────────────────────────
function setupNav() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;
      navigateTo(page);
      // close sidebar on mobile
      document.getElementById("sidebar").classList.remove("open");
    });
  });
}

function navigateTo(page) {
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add("active");

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  const pageEl = document.getElementById(`${page}-page`);
  if (pageEl) pageEl.classList.add("active-page");
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// ── LOAD DATA ─────────────────────────────────
async function loadData() {
  showLoader(true);
  try {
    const res  = await fetch(`${APP_SCRIPT_URL}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error || "Unknown error from server");

    membersData  = data.members  || [];
    summaryCache = data;

    renderDashboard(data);
    renderMembers(data);
    renderReports(data);
    if (isAdmin) populateAdminPanel(data);

    setText("lastUpdated", "Updated: " + new Date().toLocaleTimeString());
    showLoader(false);

  } catch (err) {
    showLoader(false);
    showToast("❌ " + err.message, true);
    console.error("loadData error:", err);
  }
}

// ── DASHBOARD ─────────────────────────────────
function renderDashboard(data) {
  const total   = membersData.reduce((s, m) => s + (Number(m.taka) || 0), 0);
  const expense = Number(data.totalExpense) || 0;
  const balance = total - expense;
  const meals   = membersData.reduce((s, m) => s + (Number(m.meal) || 0), 0);
  const count   = membersData.length;
  const avg     = count > 0 ? total / count : 0;
  const rate    = meals  > 0 ? expense / meals : 0;
  const month   = data.month || "N/A";

  // KPI strip
  setText("kpi-total",   fmt(total));
  setText("kpi-expense", fmt(expense));
  setText("kpi-balance", fmt(balance));
  setText("kpi-meals",   meals);

  // Summary table
  setText("s-total",   fmt(total,   true));
  setText("s-expense", fmt(expense, true));
  setText("s-balance", fmt(balance, true));
  setText("s-members", count);
  setText("s-avg",     fmt(avg,  true));
  setText("s-rate",    fmt(rate, true));

  // Month badge
  setText("month-badge", month);

  // Top contributors
  const sorted = [...membersData].sort((a, b) => b.taka - a.taka);
  const maxTaka = sorted[0]?.taka || 1;
  const rankClasses = ["gold", "silver", "bronze"];
  const html = sorted.map((m, i) => `
    <div class="contributor-item">
      <div class="contrib-rank ${rankClasses[i] || ""}">${i + 1}</div>
      <div class="contrib-bar-wrap">
        <div class="contrib-name">
          <span>${m.name}</span>
          <span class="contrib-amount">${fmt(m.taka)}</span>
        </div>
        <div class="contrib-bar-bg">
          <div class="contrib-bar-fill" style="width:${(m.taka / maxTaka * 100).toFixed(1)}%"></div>
        </div>
      </div>
    </div>`).join("");
  document.getElementById("top-contributors").innerHTML = html;

  // Note
  const noteBar  = document.getElementById("note-bar");
  const noteText = data.note || "";
  if (noteText.trim()) {
    noteBar.style.display = "flex";
    setText("note-text", noteText);
  } else {
    noteBar.style.display = "none";
  }
}

// ── MEMBERS TABLE ─────────────────────────────
function renderMembers(data) {
  const tbody = document.getElementById("member-tbody");
  tbody.innerHTML = "";

  const editCol = document.querySelector(".admin-col");
  if (editCol) editCol.style.display = isAdmin ? "" : "none";

  setText("member-count-badge", `${membersData.length} members`);

  membersData.forEach((m, i) => {
    const initials = m.name.slice(0, 2).toUpperCase();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="row-num">${i + 1}</td>
      <td>
        <div class="td-name">
          <div class="avatar">${initials}</div>
          ${m.name}
        </div>
      </td>
      <td><span class="chip chip-green">${fmt(m.taka)}</span></td>
      <td><span class="chip chip-amber">${m.meal}</span></td>
      <td><span class="chip chip-blue">${fmt(m.handcash)}</span></td>
      <td class="admin-col" style="display:${isAdmin ? "" : "none"}">
        <button class="edit-btn" onclick="openEditModal(${i})">
          <i class="fas fa-pen"></i> Edit
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// ── REPORTS ───────────────────────────────────
function renderReports(data) {
  const maxTaka     = Math.max(...membersData.map(m => m.taka),     1);
  const maxMeal     = Math.max(...membersData.map(m => m.meal),     1);
  const maxHandcash = Math.max(...membersData.map(m => m.handcash), 1);

  renderBarChart("bar-deposit",  membersData, m => m.taka,     maxTaka,     "৳",  "");
  renderBarChart("bar-meals",    membersData, m => m.meal,     maxMeal,     "",   "red");
  renderBarChart("bar-handcash", membersData, m => m.handcash, maxHandcash, "৳",  "amber");
}

function renderBarChart(containerId, members, getValue, max, prefix, colorClass) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = members.map(m => {
    const val = getValue(m);
    const pct = max > 0 ? (val / max * 100).toFixed(1) : 0;
    return `
      <div class="bar-row">
        <div class="bar-label" title="${m.name}">${m.name}</div>
        <div class="bar-track">
          <div class="bar-fill ${colorClass}" style="width:${pct}%"></div>
        </div>
        <div class="bar-val">${prefix}${Number(val).toFixed(colorClass === "red" ? 0 : 2)}</div>
      </div>`;
  }).join("");
}

// ── ADMIN PANEL ───────────────────────────────
function populateAdminPanel(data) {
  const expense = document.getElementById("inp-expense");
  const month   = document.getElementById("inp-month");
  const note    = document.getElementById("inp-note");

  if (expense && data.totalExpense !== undefined) expense.value = data.totalExpense;
  if (month   && data.month)                     month.value   = data.month;
  if (note    && data.note  !== undefined)        note.value    = data.note;

  // Member quick-edit list
  const list = document.getElementById("admin-member-list");
  if (!list) return;
  list.innerHTML = membersData.map((m, i) => `
    <div class="admin-member-row">
      <div class="admin-member-name">${m.name}</div>
      <input type="number" class="inp" id="am-taka-${i}"     value="${m.taka}"     placeholder="Taka"     step="0.01" />
      <input type="number" class="inp" id="am-meal-${i}"     value="${m.meal}"     placeholder="Meal" />
      <input type="number" class="inp" id="am-hcash-${i}"    value="${m.handcash}" placeholder="HandCash" step="0.01" />
      <button class="btn-primary" onclick="adminSaveMember(${i})">
        <i class="fas fa-save"></i> Save
      </button>
    </div>`).join("");
}

async function adminUpdateExpense() {
  const val = parseFloat(document.getElementById("inp-expense").value);
  if (isNaN(val)) { showToast("❌ Enter a valid amount", true); return; }
  await postData({ type: "updateExpense", expense: val });
}

async function adminUpdateMonth() {
  const val = document.getElementById("inp-month").value.trim();
  if (!val) { showToast("❌ Enter a month", true); return; }
  await postData({ type: "updateMonth", month: val });
}

async function adminUpdateNote() {
  const val = document.getElementById("inp-note").value;
  await postData({ type: "updateNote", note: val });
}

async function adminSaveMember(i) {
  const taka     = parseFloat(document.getElementById(`am-taka-${i}`).value)  || 0;
  const meal     = parseFloat(document.getElementById(`am-meal-${i}`).value)  || 0;
  const handcash = parseFloat(document.getElementById(`am-hcash-${i}`).value) || 0;
  await postData({ type: "updateMember", index: i, taka, meal, handcash });
}

// ── EDIT MEMBER MODAL ─────────────────────────
function openEditModal(i) {
  const m = membersData[i];
  if (!m) return;
  document.getElementById("edit-idx").value      = i;
  document.getElementById("edit-name").value     = m.name;
  document.getElementById("edit-taka").value     = m.taka;
  document.getElementById("edit-meal").value     = m.meal;
  document.getElementById("edit-handcash").value = m.handcash;
  openModal("editModal");
}

async function saveMemberEdit() {
  const i        = parseInt(document.getElementById("edit-idx").value);
  const taka     = parseFloat(document.getElementById("edit-taka").value)     || 0;
  const meal     = parseFloat(document.getElementById("edit-meal").value)     || 0;
  const handcash = parseFloat(document.getElementById("edit-handcash").value) || 0;
  closeModal("editModal");
  await postData({ type: "updateMember", index: i, taka, meal, handcash });
}

// ── LOGIN ─────────────────────────────────────
function openLoginModal() { openModal("loginModal"); }

function doLogin() {
  const user = document.getElementById("inp-user").value.trim();
  const pass = document.getElementById("inp-pass").value;
  const err  = document.getElementById("loginError");

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    isAdmin = true;
    closeModal("loginModal");

    const btn = document.getElementById("loginBtn");
    if (btn) {
      btn.innerHTML = '<i class="fas fa-user-shield"></i><span>Admin Mode</span>';
      btn.classList.add("admin-active");
    }

    // Show admin nav
    const adminNav = document.getElementById("admin-nav-item");
    if (adminNav) adminNav.style.display = "";

    // Show admin columns in members table
    document.querySelectorAll(".admin-col").forEach(el => el.style.display = "");

    populateAdminPanel(summaryCache);
    showToast("✅ Admin login successful!");
  } else {
    err.textContent = "❌ Invalid username or password!";
    err.classList.remove("d-none");
  }
}

// allow Enter key in login form
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && document.getElementById("loginModal").classList.contains("open")) {
    doLogin();
  }
});

// ── HELPERS ───────────────────────────────────
async function postData(body) {
  try {
    const res  = await fetch(APP_SCRIPT_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Save failed");
    showToast("✅ Saved successfully!");
    await loadData();
  } catch (err) {
    showToast("❌ " + err.message, true);
    console.error("postData error:", err);
  }
}

function fmt(n, withTaka = false) {
  const fixed = Number(n || 0).toFixed(2);
  return withTaka ? `৳ ${fixed}` : `৳ ${fixed}`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showLoader(visible) {
  const el = document.getElementById("loader");
  if (el) el.style.display = visible ? "flex" : "none";
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

let toastTimer;
function showToast(msg, isError = false) {
  const old = document.querySelector(".toast");
  if (old) old.remove();

  const t = document.createElement("div");
  t.className = "toast" + (isError ? " error" : "");
  t.innerHTML = msg;
  document.body.appendChild(t);

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 3500);
}
