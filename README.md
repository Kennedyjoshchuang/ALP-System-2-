# PT. Omega Trust Logistik - Management System

Welcome to the OTL Freight Forwarding Management System. This project is a custom-built ERP solution for managing logistics operations, marketing prospects, and accounting.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend (API & Database)
```bash
node server/index.cjs
```
The server will run on `http://localhost:5000`. It automatically initializes the SQLite database (`omega_trust.db`).

### 3. Start the Frontend (UI)
```bash
npm run dev
```
The website will be available at `http://localhost:5173`.

## 📂 Project Structure
- `server/`: Backend logic and SQLite configuration.
- `src/components/`: Reusable UI components (OTP, Dashboard, etc.).
- `src/pages/`: Main application modules (Marketing, Admin, Accounting).
- `src/context/`: Global state management and API integration.

## 🔐 Authorization
To access the **System Control** or **Accounting** modules, use the following credentials:
- **Role**: Owner
- **Password**: 1234
- **OTP**: A rolling 4-digit key generated in the System Management tab.

## 📋 Transferring to a New Computer
If you are moving this project to another computer:
1. Copy the entire project folder.
2. Ensure Node.js (v18+) is installed.
3. Follow the **Quick Start** steps above.
4. Point your AI assistant to `OTL-SYSTEM-SPEC.md` for full technical context.
