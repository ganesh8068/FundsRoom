# 📋 FundsRoom — Mini ERP + CRM Operations Portal

> **Full-Stack Case Study Project**
> A microservices-based Enterprise Resource Planning portal built with **React 19 + Vite** (frontend) and **Node.js + Express 5** (backend), backed by **PostgreSQL 15**.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema (ERD)](#4-database-schema-erd)
5. [Backend — Microservices](#5-backend--microservices)
6. [Frontend — React SPA](#6-frontend--react-spa)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [API Reference](#8-api-reference)
9. [Role-Based Access Control (RBAC)](#9-role-based-access-control-rbac)
10. [Getting Started — Local Setup](#10-getting-started--local-setup)
11. [Deployment (Render)](#11-deployment-render)
12. [Seeding the Database](#12-seeding-the-database)
13. [Environment Variables](#13-environment-variables)
14. [Project Structure](#14-project-structure)

---

## 1. Project Overview

FundsRoom is a **Mini ERP + CRM Operations Portal** designed for small-to-medium businesses. It provides three core modules:

| Module | Description |
|--------|-------------|
| **Customer CRM** | Manage customer contacts, track leads, add follow-up notes, filter by type/status |
| **Products & Stock** | Product catalogue with SKU, pricing, stock levels, location tracking, and stock movement history |
| **Sales Challans** | Create, confirm, or cancel delivery challans linked to customers and products with automatic stock deduction |

### Key Features
- 🔐 JWT-based authentication with role-based access control (4 roles)
- 🏗️ Microservices architecture with API Gateway pattern
- 📊 Real-time search, filtering, and pagination across all modules
- 🧾 Challan builder with product selection and automatic stock verification
- 📝 Customer follow-up notes timeline
- 📦 Stock movement audit trail (IN/OUT with reasons)
- 🎨 Premium dark-theme UI with Sage Green palette

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.8 | UI library |
| Vite | 8.2.x | Build tool & dev server |
| Vanilla CSS | — | Styling (custom design system) |
| Inter (Google Fonts) | — | Typography |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24.x | JavaScript runtime |
| Express | 5.2.1 | Web framework |
| PostgreSQL | 15 | Relational database |
| pg | 8.22.0 | PostgreSQL client for Node.js |
| bcryptjs | 3.0.3 | Password hashing |
| jsonwebtoken | 9.0.3 | JWT token generation & verification |
| express-http-proxy | 2.1.2 | API Gateway reverse proxy |
| concurrently | 10.0.4 | Run multiple services simultaneously |
| dotenv | 17.4.2 | Environment variable management |

### Infrastructure
| Service | Purpose |
|---|---|
| Docker | Local PostgreSQL container |
| Render | Cloud deployment (Backend + Frontend + PostgreSQL) |

---

## 3. Architecture Overview

The backend follows a **microservices architecture** with an **API Gateway** pattern. Each business domain runs as a separate Express process:

```
┌──────────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                         │
│                   http://localhost:5173                       │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP (fetch)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                API Gateway  :8000                            │
│    ┌─────────────────────────────────────────────────────┐   │
│    │  /api/auth      → proxy → Auth Service     :8001    │   │
│    │  /api/customers → proxy → Customer Service :8002    │   │
│    │  /api/products  → proxy → Inventory Service :8003   │   │
│    │  /api/challans  → proxy → Challan Service  :8004    │   │
│    │  /health        → direct health check               │   │
│    └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              PostgreSQL Database  :5432                       │
│               Database: minierp                              │
│   Tables: users, customers, customer_notes, products,        │
│           stock_movements, challans, challan_items            │
└──────────────────────────────────────────────────────────────┘
```

### Service Communication
- **Frontend → Backend**: All API calls go through the Gateway on port `8000`
- **Gateway → Microservices**: `express-http-proxy` forwards requests to individual services
- **Challan → Inventory (internal)**: When confirming a challan, the Challan Service calls the Inventory Service's internal endpoint to verify and deduct stock

---

## 4. Database Schema (ERD)

```mermaid
erDiagram
    users {
        int id PK
        varchar username UK
        varchar password_hash
        varchar role
        timestamp created_at
    }
    
    customers {
        int id PK
        varchar name
        varchar mobile
        varchar email
        varchar business_name
        varchar gst_number
        varchar type
        text address
        varchar status
        date follow_up_date
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    customer_notes {
        int id PK
        int customer_id FK
        text note
        varchar created_by
        timestamp created_at
    }
    
    products {
        int id PK
        varchar name
        varchar sku UK
        varchar category
        decimal unit_price
        int current_stock
        int min_stock_alert
        varchar location
        timestamp created_at
        timestamp updated_at
    }
    
    stock_movements {
        int id PK
        int product_id FK
        int quantity_changed
        varchar movement_type
        varchar reason
        varchar created_by
        timestamp created_at
    }
    
    challans {
        int id PK
        varchar challan_number UK
        int customer_id FK
        varchar status
        int total_quantity
        varchar created_by
        timestamp created_at
        timestamp updated_at
    }
    
    challan_items {
        int id PK
        int challan_id FK
        int product_id FK
        int quantity
        decimal unit_price_snapshot
        varchar product_name_snapshot
        varchar sku_snapshot
    }
    
    customers ||--o{ customer_notes : "has notes"
    customers ||--o{ challans : "has challans"
    products ||--o{ stock_movements : "has movements"
    challans ||--o{ challan_items : "contains items"
    products ||--o{ challan_items : "referenced in"
```

### Table Constraints

| Table | Column | Constraint |
|---|---|---|
| `users` | `role` | `CHECK IN ('Admin', 'Sales', 'Warehouse', 'Accounts')` |
| `customers` | `type` | `CHECK IN ('Retail', 'Wholesale', 'Distributor')` |
| `customers` | `status` | `CHECK IN ('Lead', 'Active', 'Inactive')` |
| `stock_movements` | `movement_type` | `CHECK IN ('IN', 'OUT')` |
| `challans` | `status` | `CHECK IN ('Draft', 'Confirmed', 'Cancelled')` |

---

## 5. Backend — Microservices

Each microservice follows the **MVC pattern**: `routes/ → controllers/ → models/`

### 5.1 API Gateway (`services/gateway/`)
- **Port**: 8000
- **Purpose**: Single entry point for all API requests
- Routes requests to internal services via `express-http-proxy`
- Provides `/health` endpoint for monitoring
- Configured with CORS to allow all origins

### 5.2 Auth Service (`services/auth/`)
- **Port**: 8001
- **Purpose**: User authentication & JWT token management
- On startup, runs `initDb()` which:
  - Executes `schema.sql` to create all tables (if not exist)
  - Seeds 4 default user accounts (admin, sales, warehouse, accounts)
- Endpoints: `POST /login`, `GET /me`

### 5.3 Customer Service (`services/customer/`)
- **Port**: 8002
- **Purpose**: CRUD operations on customer records and follow-up notes
- Supports search, type filtering, status filtering, and pagination
- Endpoints: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `POST /:id/notes`

### 5.4 Inventory Service (`services/inventory/`)
- **Port**: 8003
- **Purpose**: Product management, stock tracking, and stock movement history
- Includes an internal API for challan stock verification
- Endpoints: `GET /`, `POST /`, `PUT /:id`, `GET /:id/movements`, `POST /internal/verify-and-update-stock`

### 5.5 Challan Service (`services/challan/`)
- **Port**: 8004
- **Purpose**: Sales challan lifecycle management (Draft → Confirmed → Cancelled)
- On confirmation, calls Inventory Service to verify & deduct stock
- Endpoints: `GET /`, `GET /:id`, `POST /`, `PUT /:id`

---

## 6. Frontend — React SPA

### Pages

| Page | File | Description |
|---|---|---|
| **Login** | `LoginPage.jsx` | JWT login form with error handling |
| **Dashboard** | `DashboardPage.jsx` | Layout shell with sidebar navigation & role-based menu |
| **Customer CRM** | `CRMPage.jsx` | Customer list + detail view + add/edit modal + notes timeline |
| **Products & Stock** | `InventoryPage.jsx` | Product catalogue + stock movement history + add/edit modal |
| **Sales Challans** | `ChallanPage.jsx` | Challan list + detail view + challan builder with product picker |

### Design System

The UI uses a custom CSS design system with CSS variables defined in `index.css`:
- **Color palette**: Sage Green (`#659287`, `#88BDA4`, `#B1D3B9`, `#E6F2DD`)
- **Typography**: Inter font family (Google Fonts)
- **Effects**: Glassmorphism, gradient backgrounds, glow shadows
- **Components**: Buttons, badges, form controls, tables, modals, stat cards

### State Management
- **No external state library** — uses React's `useState` and `useEffect` hooks
- Token and user data persisted in `localStorage`
- Backend URL configured via `VITE_API_URL` environment variable

---

## 7. Authentication & Authorization

### Flow
```
1. User submits username + password → POST /api/auth/login
2. Backend verifies credentials with bcrypt
3. Returns JWT token (24h expiry) + user object {id, username, role}
4. Frontend stores token in localStorage
5. All subsequent API calls include: Authorization: Bearer <token>
6. Backend middleware authenticateToken() verifies the JWT
7. authorizeRoles() middleware checks if user's role is permitted
```

### JWT Token Payload
```json
{
  "id": 1,
  "username": "admin",
  "role": "Admin",
  "iat": 1723190400,
  "exp": 1723276800
}
```

---

## 8. API Reference

### Auth Service (via `/api/auth`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/api/auth/login` | ❌ | All | Login and receive JWT token |
| GET | `/api/auth/me` | ✅ | All | Get current authenticated user info |

### Customer Service (via `/api/customers`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/customers` | ✅ | All | List customers (search, filter, paginate) |
| GET | `/api/customers/:id` | ✅ | All | Get customer detail + notes |
| POST | `/api/customers` | ✅ | Admin, Sales | Create new customer |
| PUT | `/api/customers/:id` | ✅ | Admin, Sales | Update customer |
| POST | `/api/customers/:id/notes` | ✅ | All | Add follow-up note |

#### Query Parameters for `GET /api/customers`
| Param | Type | Description |
|---|---|---|
| `search` | string | Search by name, business, mobile, or email |
| `type` | string | Filter: `Retail`, `Wholesale`, `Distributor` |
| `status` | string | Filter: `Lead`, `Active`, `Inactive` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

### Inventory Service (via `/api/products`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/products` | ✅ | All | List all products |
| POST | `/api/products` | ✅ | Admin, Warehouse | Create new product |
| PUT | `/api/products/:id` | ✅ | Admin, Warehouse | Update product |
| GET | `/api/products/:id/movements` | ✅ | All | Get stock movement history |

### Challan Service (via `/api/challans`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/challans` | ✅ | All | List all challans |
| GET | `/api/challans/:id` | ✅ | All | Get challan with items |
| POST | `/api/challans` | ✅ | Admin, Sales | Create new challan |
| PUT | `/api/challans/:id` | ✅ | All | Update challan status |

---

## 9. Role-Based Access Control (RBAC)

### Default User Accounts

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |
| `sales` | `sales123` | Sales |
| `warehouse` | `warehouse123` | Warehouse |
| `accounts` | `accounts123` | Accounts |

### Permission Matrix

| Feature | Admin | Sales | Warehouse | Accounts |
|---|---|---|---|---|
| **View Customer CRM** | ✅ | ✅ | ❌ | ✅ |
| **Create/Edit Customer** | ✅ | ✅ | ❌ | ❌ |
| **Add Customer Notes** | ✅ | ✅ | ❌ | ✅ |
| **View Products & Stock** | ✅ | ✅ | ✅ | ❌ |
| **Create/Edit Products** | ✅ | ❌ | ✅ | ❌ |
| **View Sales Challans** | ✅ | ✅ | ✅ | ✅ |
| **Create Challans** | ✅ | ✅ | ❌ | ❌ |
| **Update Challan Status** | ✅ | ✅ | ✅ | ✅ |

### Sidebar Menu Visibility

| Menu Item | Visible to |
|---|---|
| 📊 Customer CRM | Admin, Sales, Accounts |
| 📦 Products & Stock | Admin, Sales, Warehouse |
| 🚚 Sales Challans | Admin, Sales, Warehouse, Accounts |

---

## 10. Getting Started — Local Setup

### Prerequisites
- **Node.js** v20+ (v24 recommended)
- **Docker Desktop** (for PostgreSQL container)
- **npm** or **yarn**

### Step 1: Clone the Repository
```bash
git clone https://github.com/ganesh8068/FundsRoom.git
cd fundsroom
```

### Step 2: Start PostgreSQL via Docker
```bash
docker run -d \
  --name local-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=minierp \
  -p 5432:5432 \
  --restart=always \
  postgres:15
```

### Step 3: Setup Backend
```bash
cd backend
npm install
cp .env.example .env    # Edit if needed
npm run start           # Starts all 5 microservices
```

### Step 4: Setup Frontend
```bash
cd frontend
npm install
npm run dev             # Starts Vite dev server on port 5173
```

### Step 5: Seed Sample Data (Optional)
```bash
cd backend
node seed.js
```

### Step 6: Open the Application
Navigate to **http://localhost:5173** and login with `admin` / `admin123`

---

## 11. Deployment (Render)

### Backend Deployment
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm run start`
- **Environment Variables**: Set `DATABASE_URL`, `JWT_SECRET`, and `PORT`

### Frontend Deployment
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/dist`
- **Environment Variables**: Set `VITE_API_URL` to your backend Render URL (e.g., `https://fundsroom-qciy.onrender.com/api`)

### PostgreSQL
- Use Render's managed PostgreSQL service
- Set the **External Database URL** as `DATABASE_URL` in the backend service

---

## 12. Seeding the Database

The project includes `backend/seed.js` which populates the database with sample data:

| Data | Count | Details |
|---|---|---|
| Customers | 10 | Mix of Active (6), Lead (2), Inactive (1) |
| Customer Notes | 10 | Timeline notes from sales, admin, accounts, warehouse |
| Products | 15 | Electronics, Accessories, Cables, Storage, Office |
| Stock Movements | 8 | IN (5) and OUT (3) with reasons |
| Sales Challans | 6 | Draft (2), Confirmed (3), Cancelled (1) |

Run with:
```bash
cd backend
node seed.js
```

---

## 13. Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | API Gateway port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/minierp` | PostgreSQL connection string |
| `JWT_SECRET` | `super_secret_jwt_key_123` | Secret key for signing JWT tokens |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API base URL |

> **Note**: The `DATABASE_URL` automatically enables SSL when the host is not `localhost` or `127.0.0.1`, making it production-ready for Render.

---

## 14. Project Structure

```
fundsroom/
├── README.md
│
├── backend/
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── seed.js                          # Database seed script
│   │
│   └── services/
│       ├── gateway/                     # API Gateway (:8000)
│       │   └── index.js                 #   Express proxy to microservices
│       │
│       ├── auth/                        # Auth Service (:8001)
│       │   ├── index.js
│       │   ├── controllers/
│       │   │   └── authController.js    #   Login & /me endpoints
│       │   ├── models/
│       │   │   └── userModel.js         #   User DB queries
│       │   └── routes/
│       │       └── authRoutes.js        #   POST /login, GET /me
│       │
│       ├── customer/                    # Customer Service (:8002)
│       │   ├── index.js
│       │   ├── controllers/
│       │   │   └── customerController.js
│       │   ├── models/
│       │   │   └── customerModel.js     #   CRUD + notes queries
│       │   └── routes/
│       │       └── customerRoutes.js    #   CRUD + notes routes
│       │
│       ├── inventory/                   # Inventory Service (:8003)
│       │   ├── index.js
│       │   ├── controllers/
│       │   │   └── inventoryController.js
│       │   ├── models/
│       │   │   └── inventoryModel.js    #   Products + stock queries
│       │   └── routes/
│       │       └── inventoryRoutes.js   #   CRUD + movements + internal
│       │
│       ├── challan/                     # Challan Service (:8004)
│       │   ├── index.js
│       │   ├── controllers/
│       │   │   └── challanController.js
│       │   ├── models/
│       │   │   └── challanModel.js      #   Challans + items queries
│       │   └── routes/
│       │       └── challanRoutes.js     #   CRUD + status update
│       │
│       └── shared/                      # Shared across all services
│           ├── db.js                    #   PostgreSQL pool + initDb()
│           ├── schema.sql               #   Database schema (7 tables)
│           └── auth.js                  #   JWT middleware (authenticate + authorize)
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    │
    └── src/
        ├── main.jsx                     # React entry point
        ├── App.jsx                      # Root component (auth state management)
        ├── App.css                      # Vite default styles
        ├── index.css                    # Full design system (Sage Green palette)
        │
        └── pages/
            ├── LoginPage.jsx            # Authentication form
            ├── DashboardPage.jsx        # Layout shell + sidebar + role routing
            ├── CRMPage.jsx              # Customer list/detail/add/edit/notes
            ├── InventoryPage.jsx        # Product list/add/edit/stock movements
            └── ChallanPage.jsx          # Challan list/detail/builder
```

---

## 🔗 Live URLs

| Service | URL |
|---|---|
| **Frontend** (local) | http://localhost:5173 |
| **Backend** (local) | http://localhost:8000 |
| **Backend** (Render) | https://fundsroom-qciy.onrender.com |

---

> **Author**: Ganesh Lokhande
> **License**: ISC
