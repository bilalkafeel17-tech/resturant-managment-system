# Servora — Restaurant Operations and Management SaaS

> **Tagline:** Restaurant Operations, Made Simpler.

Servora is a commercial-grade, multi-tenant Restaurant Operations and Management SaaS platform built for high-throughput restaurant environments, casual cafes, fast-food chains, fine-dining restaurants, takeaway, and multi-branch operations.

---

## 🌟 Key Features

- **Multi-Tenant & Multi-Branch Architecture**: Tenant-isolated records, branch switching, custom currency (PKR default), regional tax rates (FBR/PRA/SRB GST), service charges, and receipt identity.
- **Fast Point of Sale (POS)**: High-speed cashier interface, category filtering, search, dine-in table assignment, takeaway/delivery modes, custom discounts, server-side verified tax calculations, and 80mm/58mm thermal receipt printing.
- **Real-Time Kitchen Display System (KDS)**: Live Socket.IO order synchronization, elapsed timers, visual priority alerts, item-level prep status transitions (Pending -> Cooking -> Ready -> Served).
- **Interactive Tables & Reservations**: Visual table status grid (Available, Occupied, Reserved, Cleaning) and conflict-checked table reservation management.
- **Recipe & Inventory Engine**: Ingredient stock tracking with customizable units (`kg`, `g`, `ltr`, `ml`, `pcs`), low-stock alerts, purchase order management, and automatic recipe-based stock deduction.
- **Modular Payments & Safepay Gateway**: Pluggable payment adapter architecture supporting Cash and Safepay checkout sessions, HMAC-SHA256 webhook verification, and idempotent transaction recording.
- **Role-Based Access Control (RBAC)**: Enforced roles: `superadmin` (Platform Admin), `admin` (Restaurant Owner), `manager` (Branch Manager), `cashier`, and `kitchen`.
- **Financial Analytics & Export**: Live dynamic dashboard analytics, sales trends, category performance, expense tracking, and CSV data export.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6, Socket.IO Client.
- **Backend**: Node.js (ES Modules), Express.js, MongoDB with Mongoose ODM, Socket.IO, JWT, bcryptjs, Helmet, CORS, Express-Rate-Limit.
- **Testing**: Vitest, Supertest.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v25)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI.

### 2. Installation
From the project root:
```bash
npm install
npm run install:all
```

### 3. Environment Setup
Configure server environment:
```bash
cp server/.env.example server/.env
```
Ensure your `server/.env` contains:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/servora_db
JWT_SECRET=servora_super_secure_jwt_secret_key_2026
SAFEPAY_API_KEY=sec_sand_placeholder_safepay_key
SAFEPAY_WEBHOOK_SECRET=vcs_sand_placeholder_secret
SAFEPAY_ENVIRONMENT=sandbox
```

Configure client environment:
```bash
cp client/.env.example client/.env
```

### 4. Database Seeding (Demo Data)
Populate realistic demo data for **Lahore Grill & Cafe** (2 branches, menu, tables, ingredients, recipes, historical orders, staff):
```bash
npm run seed
```

### 5. Running in Development
Start both server and client concurrently:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

---

## 👥 Seeded Demo Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Restaurant Admin / Owner** | `admin@lahoregrill.pk` | `Admin@1234` | Full restaurant access, settings, reports, staff |
| **Branch Manager** | `manager.gulberg@lahoregrill.pk` | `Manager@1234` | Gulberg branch POS, KDS, inventory, reports |
| **Cashier** | `cashier@lahoregrill.pk` | `Cashier@1234` | POS billing, order creation, receipt printing |
| **Kitchen Staff** | `kitchen@lahoregrill.pk` | `Kitchen@1234` | Real-time Kitchen Display System (KDS) |
| **Platform Superadmin** | `superadmin@servora.io` | `SuperAdmin@1234` | Platform-wide administration |

---

## 🧪 Testing

Run backend and API integration tests:
```bash
npm run test
```

---

## 📄 License
Commercial proprietary software. All rights reserved.
