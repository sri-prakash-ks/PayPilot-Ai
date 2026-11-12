# PayPilot AI – Intelligent FinTech & Automated Payment Platform

**PayPilot AI** is an intelligent AI-powered financial assistant and payment management SaaS platform designed for small businesses, shop owners, and entrepreneurs. It bridges the gap between conversational AI and real-time payment operations by combining Google Gemini LLMs with the PayPal Developer Sandbox Checkout API.

---

## 🌟 Key Features

### 1. 📊 Executive FinTech Dashboard
- **Real-Time Financial Metrics**: Total Revenue, Verified Payments Received, Pending Invoices, and Total Transactions.
- **Interactive Financial Visualizations**: Monthly revenue vs. expense comparisons using Chart.js.
- **AI Financial Insights Widget**: Automated summaries highlighting revenue acceleration, collections risks, and working capital opportunities.
- **Recent PayPal Transactions Log**: Live settlement history with status pills and verified backend capture references.

### 2. 🧾 AI Invoice Generator & Invoicing Suite
- **Natural Language Line Item Generator**: Type simple project descriptions (e.g., *"E-commerce checkout revamp with 2 revisions and 1 month maintenance"*); PayPilot AI parses and auto-formats itemized deliverables with unit prices, quantities, and taxes.
- **Auto Calculations**: Instant subtotal, configurable sales tax, and total amount calculation.
- **Unique Invoicing**: Generates sequential, standardized invoice IDs (`INV-2026-00X`).
- **Official PDF Downloads**: One-click professional vector PDF invoices generated directly via Python ReportLab.
- **Shareable PayPal Payment Links**: Direct customer checkout link generated for every invoice (`/pay/<invoice_number>`).

### 3. 💳 Smart Payment Tracker
- **PayPal Sandbox Reconciliation**: Tracks gross amount, PayPal processing fees (2.9% + $0.30), and net payout.
- **Backend Order Verification**: Captures transactions securely on the Flask backend via PayPal OAuth2 REST APIs.
- **Audit Modal**: View cryptographically verified PayPal Capture IDs, payer metadata, and raw API payloads.
- **Search & Filtering**: Filter by status (`COMPLETED`, `PENDING`, `FAILED`) or search by transaction ID, customer name, and email.
- **CSV Export**: Export all historical financial records with one click.

### 4. 🤖 PayPilot Assistant (Conversational FinTech AI)
- **Live Database Context**: Answers natural language questions by querying real database metrics (e.g., *"How much revenue did I make this month?"*, *"Which invoices are pending?"*, *"What are my total expenses?"*, *"How can I improve my cash flow?"*).
- **Gemini LLM Integration**: Uses Google's `gemini-1.5-flash` or `gemini-2.0-flash` with a built-in intelligent offline fallback engine.
- **Quick Prompt Chips**: 1-click prompt triggers for rapid financial discovery.

### 5. 📈 AI Cash Flow Analyst
- **Profit & Loss Trajectory**: Visual tracking of cash inflows vs operating outflows.
- **Expense Allocation Donut**: Categorized breakdowns across Cloud Infrastructure, Contractor Fees, Software SaaS, and Marketing.
- **AI Spending Anomaly Detector**: Identifies irregular spending spikes (e.g., contractor fee increases).
- **Runway & Burn Rate Calculator**: Estimates monthly burn rate and financial runway in months.
- **Strategic Liquidity Recommendations**: Actionable suggestions (e.g., early settlement discounts, retainer requirements).

### 6. 🔔 Smart Payment Reminders
- **Categorized Receivables**: Automatically partitions unpaid invoices into **Overdue** (past due date) and **Upcoming** (due soon).
- **Tone-Calibrated AI Composer**: Drafts customized payment reminders in 3 tones:
  - *Polite (First Reminder)*
  - *Firm (Overdue Second Notice)*
  - *Urgent (Final Notice)*
- **1-Click Multi-Channel Dispatch**: Copy to clipboard, open pre-filled email (`mailto:`), or share directly via WhatsApp Web.

### 7. 👥 Customer Management
- Maintain a business customer directory with lifetime spend, outstanding balance, invoice counts, and contact records.
- 1-click **Invoice Client** shortcut pre-filling customer information into the invoice generator.

### 8. ⚙️ Platform Settings & Developer Controls
- Live configuration of PayPal Developer Sandbox Client ID and Secret.
- Google Gemini API key configuration with real-time test connection diagnostic.
- 1-Click **"Reset to Demo Data"** to restore pristine hackathon seed data anytime.
- Dark Mode / Light Mode toggle with seamless LocalStorage persistence.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.12, Flask, Flask-CORS, Requests, SQLite3, ReportLab, Python-Dotenv |
| **Frontend** | Vanilla HTML5, CSS3, Modern JavaScript (ES6+), Font Awesome 6, Chart.js (No React/Angular frameworks) |
| **Payment Gateway** | PayPal Developer Sandbox Checkout API & JavaScript SDK |
| **AI / LLM** | Google Gemini API (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`) + PayPilot Intelligent Heuristic Engine |
| **Storage Architecture** | SQLite database (authoritative source for payments & transactions) + Browser LocalStorage (theme preferences & UI cache) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+ installed on your system.
- Modern web browser (Chrome, Edge, Firefox, Safari).

### 2. Installation

1. Navigate to the project root directory:
   ```bash
   cd c:\Users\kanig\Downloads\paypal
   ```

2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 3. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Your `.env` file contains the following configuration keys:
```ini
# Flask Secret Key
SECRET_KEY=paypilot-fintech-secret-key-2026

# PayPal Developer Sandbox Credentials (Optional for initial demo)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_CURRENCY=USD

# Google Gemini AI API Configuration (Optional - built-in heuristic fallback included)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Business Profile Defaults
BUSINESS_NAME=Apex Digital Labs Inc.
BUSINESS_EMAIL=finance@apexdigital.io
BUSINESS_CURRENCY=USD
DEFAULT_TAX_RATE=8.5
```

> **Note on Zero-Friction Hackathon Testing:**
> If you leave `PAYPAL_CLIENT_ID` or `GEMINI_API_KEY` blank, PayPilot AI functions 100% out of the box with realistic verified sandbox fallbacks! You can enter live credentials at any time in `.env` or in the web UI under **Settings**.

### 4. Running the Application

Start the Flask server:
```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🔑 Configuring PayPal Developer Sandbox

To process actual test payments using PayPal's official sandbox environment:

1. Sign in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Under **Testing Tools**, select **Sandbox Accounts** to generate test buyer and test merchant accounts.
3. Under **Apps & Credentials**, select the **Sandbox** tab and create a new REST API app (e.g., *"PayPilot AI"*).
4. Copy your **Client ID** and **Secret Key**.
5. Paste them into `.env` or directly into the **Settings** page in the PayPilot web dashboard and click **Save Settings**.
6. When making payments on `/pay/<invoice_number>`, click the official PayPal button and log in with your PayPal Sandbox Buyer account credentials!

---

## 🧠 Configuring Google Gemini AI API

To power conversational intelligence using Google Gemini:

1. Visit [Google AI Studio](https://aistudio.google.com/) and click **Get API Key**.
2. Create a free API key.
3. In the PayPilot web app, navigate to **Settings** > **Google Gemini AI Engine**.
4. Paste your API key, select your preferred model (`gemini-1.5-flash` recommended for low-latency financial queries), and click **Save Settings**.
5. Click **Test AI Assistant Connection** to verify end-to-end connectivity.

---

## 📂 Project Structure

```
paypilot-ai/
├── app.py                     # Main Flask server, SQLite schema, REST APIs, PayPal & AI endpoints
├── requirements.txt           # Python package dependencies
├── paypilot.db                # SQLite database (auto-initialized with realistic seed data)
├── .env.example               # Example environment configuration
├── .env                       # Local environment settings
├── README.md                  # Comprehensive product documentation
├── templates/
│   ├── base.html              # Master layout (sidebar, topbar, theme switcher, notifications)
│   ├── index.html             # Login & 1-Click Hackathon Demo authentication portal
│   ├── dashboard.html         # Executive FinTech metrics, Chart.js analytics & AI insights
│   ├── invoices.html          # Invoice list, AI line item generator, item calculator & modals
│   ├── transactions.html      # Payment tracker with PayPal verification details & CSV export
│   ├── assistant.html         # PayPilot Assistant conversational chatbot UI & prompt chips
│   ├── analytics.html         # AI Cash Flow Analyst, P&L charts & anomaly detector
│   ├── reminders.html         # Smart Payment Reminders with tone-calibrated AI notices
│   ├── customers.html         # Business customer directory & quick invoicing shortcuts
│   ├── settings.html          # Integration configuration (PayPal, Gemini, Profile, Data Reset)
│   └── pay_invoice.html       # Public customer checkout portal with live PayPal button SDK
└── static/
    ├── css/
    │   └── style.css          # Modern FinTech design system, light/dark themes, responsive CSS
    └── js/
        ├── app.js             # Global theme sync, LocalStorage, mobile navigation, toast alerts
        ├── dashboard.js       # Metric cards, Chart.js revenue charts, live insights
        ├── invoices.js        # AI invoice generator, line item calculations, PDF links
        ├── payments.js        # Payment tracking, PayPal audit modal, CSV exporter
        ├── assistant.js       # AI chat controller with streaming & markdown formatting
        ├── analytics.js       # P&L charts, expense donut, anomaly cards
        ├── reminders.js       # Overdue scheduler, tone selector, copy & WhatsApp dispatcher
        ├── customers.js       # Customer directory operations & modal handling
        └── settings.js        # Settings updater, AI tester, demo data reset handler
```

---

## 🛡️ Security & Architecture Principles

- **Zero Client-Side Secret Exposure**: PayPal client secrets and Gemini API keys are strictly kept on the Python backend and never exposed in client JavaScript.
- **Authoritative Database Source**: Real transaction statuses, PayPal capture IDs, and verified receipts are stored in the backend SQLite database, preventing tampering.
- **LocalStorage Usage**: LocalStorage is reserved for non-sensitive client preferences (dark/light theme, search filters, and cached display preferences).
- **Graceful Fault Tolerance**: The AI assistant and PayPal checkout are built with intelligent fallback mechanisms, ensuring a polished demonstration under any network or credential condition.

---

## 🏆 Hackathon Quick Evaluation Guide

For evaluators and judges:
1. Open `http://127.0.0.1:5000`.
2. Click **"Launch 1-Click Demo Mode (Alex Morgan)"** to enter the fully pre-seeded FinTech environment.
3. Explore the **Dashboard** to see live Chart.js visualizations and AI insights.
4. Go to **Invoices** and click **"AI Item Generator"** to experience natural language invoice creation.
5. Click **"Copy Link"** or **"Open Payment Portal"** on any invoice to test the customer PayPal checkout portal.
6. Try the **AI Financial Assistant** and click prompt chips to query real financial records.
7. Visit **Smart Reminders** to generate polite, firm, or urgent collection emails with custom PayPal links.

---

*PayPilot AI – Transforming Small Business Finances with Artificial Intelligence & PayPal.*
