# Mini ERP + CRM Operations Portal

A complete responsive full-stack operations portal for wholesale/distribution operations. It contains role-based access control (RBAC), Customer CRM tracking, Product stock control, and inventory validation checks on Sales Challan generation.

The backend is built as a microservices architecture communicating through an API Gateway.

---

## 🏗️ Architecture & Microservices

The application is split into a React frontend and a Node.js microservices backend:

*   **Frontend**: React (Vite, custom modern dark aesthetics styling). Runs on `http://localhost:5173`.
*   **API Gateway**: Proxies incoming requests from the frontend to the correct microservice. Runs on `http://localhost:8000`.
*   **Auth Service**: Handles token creation, validation, and login. Runs on `http://localhost:8001`.
*   **Customer Service**: Manages customer directory and timeline notes. Runs on `http://localhost:8002`.
*   **Inventory Service**: Manages product catalog, stock updates, and movement logging. Runs on `http://localhost:8003`.
*   **Challan Service**: Manages sales challans (Draft/Confirmed/Cancelled) and coordinates with Inventory Service to verify & deduct stock. Runs on `http://localhost:8004`.

---

## 🔑 Default Accounts (Credentials)

The database is automatically seeded with four testing accounts, one for each role:

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **admin** | `admin123` | **Admin** | Unrestricted access across CRM, Inventory, and Challans. |
| **sales** | `sales123` | **Sales** | Can manage CRM and create/confirm sales challans. |
| **warehouse** | `warehouse123` | **Warehouse** | Can manage products, stock levels, and view challans. |
| **accounts** | `accounts123` | **Accounts** | Can audit CRM and update status/cancel sales challans. |

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

### 1. Sidebar Navigation (Frontend Visibility)
*   **Customer CRM**: Visible to **Admin**, **Sales**, and **Accounts** *(Hidden for Warehouse)*.
*   **Products & Stock**: Visible to **Admin**, **Warehouse**, and **Sales** *(Hidden for Accounts)*.
*   **Sales Challans**: Visible to **Admin**, **Sales**, **Warehouse**, and **Accounts** *(Visible to everyone)*.

### 2. Feature & API Actions

| Feature / Module | Action | Authorized Roles | Details / Constraints |
| :--- | :--- | :--- | :--- |
| **Customer CRM** | View Customers & Detail | **Admin**, **Sales**, **Accounts**, **Warehouse** | Anyone authenticated can view customer lists and notes. |
| | Create & Update Customer Info | **Admin**, **Sales** | Restricted from Warehouse & Accounts. |
| | Add Customer Note | **Admin**, **Sales**, **Accounts**, **Warehouse** | Timeline logs for follow-up notes. |
| **Products & Stock** | View Inventory & Movements | **Admin**, **Sales**, **Accounts**, **Warehouse** | Anyone authenticated can view product lists. |
| | Create & Update Products/Stock | **Admin**, **Warehouse** | Restricted from Sales & Accounts. |
| **Sales Challans** | View Challans & Details | **Admin**, **Sales**, **Accounts**, **Warehouse** | Anyone authenticated can view challans. |
| | Create Challans | **Admin**, **Sales** | Restricted from Warehouse & Accounts. |
| | Update Challan Status | **Admin**, **Sales**, **Warehouse**, **Accounts** | All roles can trigger status transitions (e.g., `Draft` ➔ `Confirmed` which deducts inventory, or `Confirmed` ➔ `Cancelled` which restores inventory). |

---

## 💾 Database Schema

The database consists of the following tables:
1.  `users`: Stores username, password hash, and user role (`Admin`, `Sales`, `Warehouse`, `Accounts`).
2.  `customers`: Stores customer demographics, business classification (`Retail`, `Wholesale`, `Distributor`), status (`Lead`, `Active`, `Inactive`), and follow-up date.
3.  `customer_notes`: Connects notes/follow-up logs to specific customers.
4.  `products`: Holds SKU, categories, current stock levels, safety/min stock alert thresholds, and warehouse location.
5.  `stock_movements`: Tracks audit trails for all stock adjustments (`IN` / `OUT`) with reasons and author tracking.
6.  `challans`: Stores sales delivery challans, overall status (`Draft`, `Confirmed`, `Cancelled`), and total items.
7.  `challan_items`: Saves snapshot unit price, product name, and SKU at the time the challan is created to prevent historical changes from affecting old orders.

---

## 🚀 Local Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   A running PostgreSQL instance

### 1. Backend Setup
1.  Open the backend directory:
    ```bash
    cd backend
    ```
2.  Create a `.env` file in `backend/` and configure:
    ```env
    PORT=8000
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/minierp
    JWT_SECRET=fallback_super_secret_jwt_key_123!
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Start all microservices concurrently:
    ```bash
    npm run dev
    ```
    *This starts the API Gateway and the 4 backend microservices together.*

### 2. Frontend Setup
1.  Open the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173` in your browser.
