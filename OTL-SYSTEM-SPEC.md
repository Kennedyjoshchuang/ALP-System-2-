# OTL FREIGHT FORWARDING SYSTEM - TECHNICAL SPECIFICATION

This document provides a comprehensive blueprint of the system to ensure continuity across different development environments and AI sessions.

## 1. System Overview
A premium Freight Forwarding Management System built for **PT. Omega Trust Logistik**.
- **Frontend**: React (Vite), Framer Motion, Lucide-React.
- **Backend**: Node.js (Express).
- **Database**: SQLite (via `better-sqlite3`).
- **Aesthetic**: Emerald Green & Gold Metallic "Glassmorphism" theme.

## 2. Database Schema (SQLite)
The database is initialized in `server/db.cjs`. Key tables include:

### `customers`
- `id`: TEXT (Primary)
- `name`: TEXT
- `phone`: TEXT
- `email`: TEXT
- `address`: TEXT

### `job_orders`
- `id`: TEXT (Primary)
- `quotationId`: TEXT (Foreign)
- `customerName`: TEXT
- `instruction`: TEXT
- `status`: TEXT (pending, dispatched, done)
- `quantity`: INTEGER
- `photos`: TEXT (JSON string array)

### `system_config` (New)
- `id`: TEXT (Primary, default: "global_config")
- `otpKey`: TEXT (4-digit rolling code)
- `otpUpdatedAt`: TEXT (ISO Timestamp)

## 3. Key Modules & Security

### Rolling OTP System (`src/components/OTPKeys.jsx`)
- Generates a 4-digit code every 60 seconds.
- Automatically syncs the code to the `system_config` table via `POST /api/system/config`.
- Required for high-privilege actions like **System Reset**.

### Multi-Step Verification
- **Step 1**: Visual confirmation.
- **Step 2**: Text verification (Type "DELETE").
- **Step 3**: Security Key verification (Must match current OTP).

## 4. API Endpoints
- `GET /api/system/config`: Retrieves current OTP.
- `POST /api/system/config`: Updates current OTP.
- `POST /api/system/clear`: Wipes operational data (Owner only).
- `GET /api/customers`, `POST /api/customers`, etc.

## 5. Design Tokens (CSS Variables)
- `--primary`: #065f46 (Emerald)
- `--secondary`: #d4af37 (Gold)
- `--bg`: #030712 (Midnight)
- `--gold-metallic`: linear-gradient(135deg, #d4af37 0%, #f1c40f 50%, #d4af37 100%)

## 6. Setup Instructions
1. Run `npm install`.
2. Start backend: `node server/index.cjs`.
3. Start frontend: `npm run dev`.
4. Login: Role `Owner`, Password `Haiga1899.2003`.

