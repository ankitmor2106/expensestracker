/* =========================================================
   EXPENSE TRACKER — script.js
   ========================================================= */

"use strict";

/* ----------------------------------------------------------
   1. CONSTANTS
   ---------------------------------------------------------- */
const STORAGE_KEY = "expense_tracker_transactions";

const CATEGORIES = {
  income:  ["Salary", "Freelance", "Investment", "Gift", "Business", "Other"],
  expense: ["Food", "Transport", "Housing", "Entertainment", "Shopping", "Health", "Education", "Utilities", "Other"],
};

// Vibrant, accessible color palette for chart
const CHART_COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed",
  "#db2777", "#0891b2", "#65a30d", "#ea580c", "#6366f1",
];

/* ----------------------------------------------------------
   2. STATE
   ---------------------------------------------------------- */
let state = {
  transactions: [],  // all persisted transactions
  period: "month",   // "all" | "week" | "month"
};

let chartInstance = null;

/* ----------------------------------------------------------
   3. STORAGE HELPERS
   ---------------------------------------------------------- */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    showToast("Could not save to storage.", "error");
  }
}

/* ----------------------------------------------------------
   4. DATA HELPERS
   ---------------------------------------------------------- */
function generateId() {
  // Timestamp base + 9 random chars = extremely low collision probability even in bulk imports
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

function getPeriodStart(period) {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

function getFilteredTransactions() {
  const since = getPeriodStart(state.period);
  if (!since) return state.transactions;
  return state.transactions.filter((t) => new Date(t.createdAt) >= since);
}

// FIX: Changed currency from USD to INR
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

/* ----------------------------------------------------------
   5. SUMMARY CALCULATIONS
   ---------------------------------------------------------- */
function calcSummary(transactions) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    balance: totalIncome - totalExpenses,
    totalIncome,
    totalExpenses,
    count: transactions.length,
  };
}

function calcCategories(transactions) {
  const expenses = transactions.filter((t) => t.type === "expense");
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);

  const map = expenses.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = { total: 0, count: 0 };
    acc[t.category].total  += t.amount;
    acc[t.category].count  += 1;
    return acc;
  }, {});

  return Object.entries(map)
    .map(([category, { total: catTotal, count }]) => ({
      category,
      total: catTotal,
      count,
      percentage: total > 0 ? Math.round((catTotal / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/* ----------------------------------------------------------
   6. RENDER — SUMMARY CARDS
   ---------------------------------------------------------- */
function renderSummary() {
  const filtered = getFilteredTransactions();
  const { balance, totalIncome, totalExpenses, count } = calcSummary(filtered);

  document.getElementById("summary-balance").textContent  = formatCurrency(balance);
  document.getElementById("summary-income").textContent   = formatCurrency(totalIncome);
  document.getElementById("summary-expenses").textContent = formatCurrency(totalExpenses);
  document.getElementById("summary-count").textContent    = `Based on ${count} transaction${count !== 1 ? "s" : ""}`;
}

/* ----------------------------------------------------------
   7. RENDER — TRANSACTION LIST
   ---------------------------------------------------------- */
const LIST_COLLAPSE_THRESHOLD = 5; // show expand btn when more than this many items

function renderTransactions() {
  const filtered   = getFilteredTransactions();
  const list       = document.getElementById("transaction-list");
  const emptyState = document.getElementById("empty-state");
  const footer     = document.getElementById("list-expand-footer");
  const label      = document.getElementById("list-expand-label");
  const listBody   = document.getElementById("list-body");

  if (filtered.length === 0) {
    list.innerHTML = "";
    emptyState.style.display = "flex";
    footer.style.display = "none";
    // Collapse back when empty
    listBody.classList.remove("expanded");
    return;
  }

  emptyState.style.display = "none";

  // Newest first
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  list.innerHTML = sorted
    .map((t) => `
      <li class="transaction-item" data-id="${t.id}">
        <span class="tx-badge ${t.type}" aria-label="${t.type}">
          ${t.type === "income" ? "IN" : "OUT"}
        </span>
        <div class="tx-body">
          <div class="tx-label" title="${escapeHtml(t.label)}">${escapeHtml(t.label)}</div>
          <div class="tx-meta">
            <span class="tx-category">${escapeHtml(t.category)}</span>
            <span class="tx-date">${formatDate(t.createdAt)}</span>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount ${t.type}">
            ${t.type === "income" ? "+" : "−"}${formatCurrency(t.amount)}
          </span>
          <button
            class="btn btn-ghost tx-delete"
            aria-label="Delete transaction: ${escapeHtml(t.label)}"
            data-id="${t.id}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </li>
    `)
    .join("");

  // Show / update the expand footer only when there are more items than threshold
  if (filtered.length > LIST_COLLAPSE_THRESHOLD) {
    footer.style.display = "block";
    const isExpanded = listBody.classList.contains("expanded");
    // Sync aria-expanded on the button to match actual DOM state after re-render
    const expandBtn = document.getElementById("list-expand-btn");
    if (expandBtn) expandBtn.setAttribute("aria-expanded", String(isExpanded));
    label.textContent = isExpanded
      ? "Show less"
      : `Show all ${filtered.length} transactions`;
  } else {
    // Fewer items than threshold — collapse and hide footer
    footer.style.display = "none";
    listBody.classList.remove("expanded");
    // Update aria on btn just in case
    const btn = document.getElementById("list-expand-btn");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
}

/* ----------------------------------------------------------
   8. RENDER — CATEGORY CHART
   ---------------------------------------------------------- */
function renderChart() {
  const filtered   = getFilteredTransactions();
  const categories = calcCategories(filtered);
  const wrapper    = document.getElementById("chart-wrapper");
  const legendEl   = document.getElementById("chart-legend");
  const emptyEl    = document.getElementById("chart-empty");

  if (categories.length === 0) {
    wrapper.style.display = "none";
    legendEl.style.display = "none";
    emptyEl.style.display = "flex";

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  wrapper.style.display = "";
  legendEl.style.display = "";
  emptyEl.style.display = "none";

  const labels     = categories.map((c) => c.category);
  const data       = categories.map((c) => c.total);
  const colors     = categories.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  if (chartInstance) {
    chartInstance.data.labels                          = labels;
    chartInstance.data.datasets[0].data               = data;
    chartInstance.data.datasets[0].backgroundColor    = colors;
    chartInstance.update();
  } else {
    const ctx = document.getElementById("category-chart").getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatCurrency(ctx.parsed)} (${categories[ctx.dataIndex].percentage}%)`,
            },
          },
        },
      },
    });
  }

  legendEl.innerHTML = categories
    .map((c, i) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${colors[i]}"></span>
        <span class="legend-name">${escapeHtml(c.category)}</span>
        <div class="legend-right">
          <span class="legend-amount">${formatCurrency(c.total)}</span>
          <span class="legend-pct">${c.percentage}%</span>
        </div>
      </div>
    `)
    .join("");
}

/* ----------------------------------------------------------
   9. FULL RENDER (all sections)
   ---------------------------------------------------------- */
function render() {
  renderSummary();
  renderTransactions();
  renderChart();
}

/* ----------------------------------------------------------
   10. FORM — CATEGORY OPTIONS
   ---------------------------------------------------------- */
function populateCategoryOptions(type) {
  const select = document.getElementById("category");
  const categories = CATEGORIES[type] || [];
  select.innerHTML = `<option value="" disabled selected>Select category</option>` +
    categories.map((c) => `<option value="${c}">${c}</option>`).join("");
}

/* ----------------------------------------------------------
   11. FORM — VALIDATION & SUBMIT
   ---------------------------------------------------------- */
function showFormError(message) {
  const el = document.getElementById("form-error");
  el.textContent = message;
}

function clearFormError() {
  document.getElementById("form-error").textContent = "";
}

function validateForm(data) {
  if (!data.label.trim()) return "Label is required.";
  if (data.label.trim().length > 100) return "Label must be 100 characters or fewer.";
  // Validate the already-parsed float so validation and submission use the same value
  if (data.rawAmount.trim() === "") return "Please enter an amount.";
  if (isNaN(data.amount)) return "Please enter a valid number.";
  if (data.amount <= 0) return "Amount must be greater than zero.";
  if (!data.category) return "Please select a category.";
  return null;
}

function handleFormSubmit(e) {
  e.preventDefault();
  clearFormError();

  const form     = e.target;
  const type     = form.type.value;
  const category = form.category.value;
  const label    = form.label.value.trim();
  // Parse amount once — used for both validation and the transaction object
  const rawAmount = form.amount.value;
  const amount    = parseFloat(String(rawAmount).replace(/,/g, "").trim());

  const error = validateForm({ label, rawAmount, amount, category });
  if (error) {
    showFormError(error);
    return;
  }

  // FIX: Use user-chosen date if provided, else now
  const dateVal = form.txdate ? form.txdate.value : "";
  const createdAt = dateVal
    ? new Date(dateVal + "T12:00:00").toISOString()
    : new Date().toISOString();

  const transaction = {
    id:        generateId(),
    label,
    amount,
    type,
    category,
    createdAt,
  };

  state.transactions = [transaction, ...state.transactions];
  saveToStorage(state.transactions);

  // FIX: render BEFORE reset so DOM state is correct
  render();

  // FIX: Capture current type before reset, restore after
  const currentType = type;
  form.reset();
  // Restore type select to previous selection so UX is smooth
  form.type.value = currentType;
  populateCategoryOptions(currentType);

  document.getElementById("label").focus();
  showToast(`Transaction "${label}" added.`, "success");
}

/* ----------------------------------------------------------
   12. DELETE
   ---------------------------------------------------------- */
function handleDeleteClick(e) {
  const btn = e.target.closest(".tx-delete");
  if (!btn) return;

  const id = btn.dataset.id;
  const tx = state.transactions.find((t) => t.id === id);
  if (!tx) return;

  state.transactions = state.transactions.filter((t) => t.id !== id);
  saveToStorage(state.transactions);
  render();

  showToast(`"${tx.label}" deleted.`, "success");
}

/* ----------------------------------------------------------
   13. PERIOD TABS
   ---------------------------------------------------------- */
function handlePeriodChange(e) {
  const btn = e.target.closest(".period-tab");
  if (!btn) return;

  document.querySelectorAll(".period-tab").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
  });

  btn.classList.add("active");
  btn.setAttribute("aria-selected", "true");

  state.period = btn.dataset.period;
  render();
}

/* ----------------------------------------------------------
   14. EXPORT — respects active period filter
   ---------------------------------------------------------- */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// FIX: Export now uses the period-filtered transactions, not all
function exportJSON() {
  const toExport = getFilteredTransactions();
  if (toExport.length === 0) {
    showToast("No transactions to export for this period.", "error");
    return;
  }
  const data = JSON.stringify(toExport, null, 2);
  downloadFile(data, `transactions_${state.period}.json`, "application/json");
  showToast(`Exported ${toExport.length} transaction(s) as JSON.`, "success");
}

function exportCSV() {
  const toExport = getFilteredTransactions();
  if (toExport.length === 0) {
    showToast("No transactions to export for this period.", "error");
    return;
  }
  const header = "id,label,amount,type,category,createdAt";
  const rows   = toExport.map((t) =>
    [t.id, `"${t.label.replace(/"/g, '""')}"`, t.amount, t.type, `"${t.category}"`, t.createdAt].join(",")
  );
  downloadFile([header, ...rows].join("\n"), `transactions_${state.period}.csv`, "text/csv");
  showToast(`Exported ${toExport.length} transaction(s) as CSV.`, "success");
}

/* ----------------------------------------------------------
   15. IMPORT (new feature)
   ---------------------------------------------------------- */
function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      let imported = [];

      if (file.name.endsWith(".json")) {
        imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error("Invalid JSON format.");
      } else if (file.name.endsWith(".csv")) {
        const lines = ev.target.result.trim().split("\n");
        // skip header row
        lines.slice(1).forEach((line) => {
          // Proper CSV field parser: handles quoted fields (including those with commas/empty values)
          const fields = [];
          let cur = "";
          let inQuote = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQuote && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
              else { inQuote = !inQuote; }
            } else if (ch === "," && !inQuote) {
              fields.push(cur);
              cur = "";
            } else {
              cur += ch;
            }
          }
          fields.push(cur); // last field

          if (fields.length < 6) return;
          const [id, label, amount, type, category, createdAt] = fields;
          imported.push({
            id:        id.trim(),
            label:     label.trim(),
            amount:    parseFloat(amount.trim()),
            type:      type.trim(),
            category:  category.trim(),
            createdAt: createdAt.trim(),
          });
        });
      } else {
        throw new Error("Unsupported file type. Use .json or .csv");
      }

      // Validate and deduplicate
      const existingIds = new Set(state.transactions.map((t) => t.id));
      const valid = imported.filter((t) =>
        t.id && t.label && t.amount > 0 && (t.type === "income" || t.type === "expense") && t.createdAt
      );
      const newOnes = valid.filter((t) => !existingIds.has(t.id));

      if (newOnes.length === 0) {
        showToast("No new transactions found (duplicates skipped).", "error");
        return;
      }

      state.transactions = [...state.transactions, ...newOnes];
      saveToStorage(state.transactions);
      render();
      showToast(`Imported ${newOnes.length} transaction(s).`, "success");
    } catch (err) {
      showToast("Import failed: " + err.message, "error");
    } finally {
      // Reset file input so the same file can be re-selected
      e.target.value = "";
    }
  };
  reader.readAsText(file);
}

/* ----------------------------------------------------------
   16. TOAST
   ---------------------------------------------------------- */
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.22s ease forwards";
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 3000);
}

/* ----------------------------------------------------------
   17. UTILS
   ---------------------------------------------------------- */
function escapeHtml(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}

/* ----------------------------------------------------------
   18. BOOT
   ---------------------------------------------------------- */
function init() {
  // Load persisted data
  state.transactions = loadFromStorage();

  // Populate initial category options (default type is "expense")
  populateCategoryOptions("expense");

  // Render initial state
  render();

  // Event: form type change → update category options
  document.getElementById("type").addEventListener("change", (e) => {
    populateCategoryOptions(e.target.value);
  });

  // Event: form submit
  document.getElementById("transaction-form").addEventListener("submit", handleFormSubmit);

  // Event: delete (delegated to list)
  document.getElementById("transaction-list").addEventListener("click", handleDeleteClick);

  // Event: period tabs (delegated)
  document.querySelector(".period-tabs").addEventListener("click", handlePeriodChange);

  // Event: export buttons
  document.getElementById("export-json").addEventListener("click", exportJSON);
  document.getElementById("export-csv").addEventListener("click", exportCSV);

  // Event: import
  document.getElementById("import-file").addEventListener("change", handleImport);

  // Event: expand/collapse transaction list
  document.getElementById("list-expand-btn").addEventListener("click", () => {
    const listBody = document.getElementById("list-body");
    const btn      = document.getElementById("list-expand-btn");
    const label    = document.getElementById("list-expand-label");
    const filtered = getFilteredTransactions();

    const expanding = !listBody.classList.contains("expanded");
    listBody.classList.toggle("expanded", expanding);
    btn.setAttribute("aria-expanded", String(expanding));
    label.textContent = expanding
      ? "Show less"
      : `Show all ${filtered.length} transactions`;
  });
}

document.addEventListener("DOMContentLoaded", init);