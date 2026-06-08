# 💰 Expense Tracker

A clean, fully client-side expense tracker built with vanilla HTML, CSS, and JavaScript. Designed for the Indian market with INR (₹) currency support, a warm earthy aesthetic, and zero dependencies beyond Chart.js.

---

## ✨ Features

### Core Functionality
- **Add transactions** — log income or expenses with a label, category, amount, and date
- **Delete transactions** — remove any entry with one click
- **Persistent storage** — all data is saved to `localStorage`; nothing is lost on page refresh

### Financial Overview
- **Summary cards** — live totals for Balance, Income, and Expenses
- **Period filtering** — view data for *This Week*, *This Month*, or *All Time*
- **Expense chart** — interactive doughnut chart (Chart.js) showing spending by category with percentages

### Transaction List
- Sorted newest-first
- Colour-coded IN / OUT badges
- Category pill + date for each entry
- Expandable list — collapses to 5 rows with a smooth animated "Show all" toggle

### Import / Export
- **Export as JSON** — downloads the currently filtered transactions
- **Export as CSV** — same, in spreadsheet-compatible format
- **Import JSON or CSV** — merges new transactions in; skips duplicates by ID

### UX Details
- Custom date picker — shows "Today" as a placeholder; lets you pick any past/future date; clearable
- Form retains the selected transaction type after submit for faster data entry
- Inline form validation with clear error messages
- Toast notifications for every action (add, delete, import, export)
- Fully accessible — ARIA labels, live regions, keyboard navigation, focus management

---

## 🛠️ Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Markup     | Semantic HTML5                            |
| Styles     | Vanilla CSS (custom properties / tokens)  |
| Logic      | Vanilla JavaScript (ES6+, strict mode)    |
| Charts     | [Chart.js 4.4](https://www.chartjs.org/)  |
| Fonts      | Google Fonts — Lora + DM Sans             |
| Storage    | Browser `localStorage`                    |

No build tools, no bundler, no framework — just open `index.html`.

---

## 📁 Project Structure

```
expense-tracker/
├── index.html     # App shell, layout, and inline UI scripts
├── style.css      # Design tokens, layout, components, responsive rules
├── script.js      # State management, rendering, form logic, import/export
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Option 1 — Open directly (no server needed)
```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
# Just open index.html in your browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

### Option 2 — Serve locally (optional, avoids any browser file:// quirks)
```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```
Then visit `http://localhost:8080`.

---

## 📸 Screenshots

> Add screenshots here once you have the app running — e.g. the dashboard, the chart, and the mobile view.

---

## 📂 Categories

**Income:** Salary, Freelance, Investment, Gift, Business, Other

**Expense:** Food, Transport, Housing, Entertainment, Shopping, Health, Education, Utilities, Other

---

## 🗂️ Data Format

Transactions are stored as a JSON array. Each object looks like:

```json
{
  "id": "lz3k9abc1",
  "label": "Grocery shopping",
  "amount": 1250.00,
  "type": "expense",
  "category": "Food",
  "createdAt": "2026-06-08T12:00:00.000Z"
}
```

This same structure is used for JSON import/export.

---

## 📤 CSV Export Format

```
id,label,amount,type,category,createdAt
lz3k9abc1,"Grocery shopping",1250,expense,"Food",2026-06-08T12:00:00.000Z
```

---

## 🎨 Design System

The UI uses a warm, earthy colour palette defined as CSS custom properties:

| Token                    | Value       | Usage                    |
|--------------------------|-------------|--------------------------|
| `--color-brand`          | `#5c3d2e`   | Primary actions, active  |
| `--color-bg`             | `#f5f2ee`   | Page background          |
| `--color-surface`        | `#ffffff`   | Cards                    |
| `--color-income`         | `#166534`   | Income amounts & badges  |
| `--color-expense`        | `#991b1b`   | Expense amounts & badges |
| `--font-serif`           | Lora        | Headings, amounts        |
| `--font-sans`            | DM Sans     | Body text, labels        |

---

## ♿ Accessibility

- All interactive elements have `aria-label` or visible labels
- Live regions (`aria-live`) announce list and toast changes to screen readers
- Period tabs use `role="tablist"` / `role="tab"` with `aria-selected`
- Export dropdown uses `aria-haspopup`, `aria-expanded`, and `aria-controls`
- Keyboard-navigable throughout; closes dropdowns on Escape
- Focus is returned to the label field after form submit

---

## 🔮 Possible Future Enhancements

- [ ] Edit existing transactions
- [ ] Recurring transactions
- [ ] Monthly budget limits per category
- [ ] Bar/line chart for spending trends over time
- [ ] Dark mode
- [ ] PWA support (offline + installable)
- [ ] Cloud sync / multi-device

---

## 📄 License

MIT — free to use, modify, and distribute.