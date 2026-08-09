import React from "react";
import CRMPage from "./CRMPage";
import InventoryPage from "./InventoryPage";
import ChallanPage from "./ChallanPage";

export default function DashboardPage({
  user,
  token,
  activeTab,
  setActiveTab,
  handleLogout
}) {
  const showCrm = ["Admin", "Sales", "Accounts"].includes(user.role);
  const showInventory = ["Admin", "Warehouse", "Sales"].includes(user.role);
  const showChallans = ["Admin", "Sales", "Warehouse", "Accounts"].includes(user.role);

  return (
    <div className="layout-wrapper">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          MiniERP <span>Portal</span>
        </div>
        <ul className="sidebar-menu">
          {showCrm && (
            <li>
              <button
                className={`sidebar-item-btn ${activeTab === "crm" ? "active" : ""}`}
                onClick={() => setActiveTab("crm")}
              >
                📊 Customer CRM
              </button>
            </li>
          )}
          {showInventory && (
            <li>
              <button
                className={`sidebar-item-btn ${activeTab === "inventory" ? "active" : ""}`}
                onClick={() => setActiveTab("inventory")}
              >
                📦 Products & Stock
              </button>
            </li>
          )}
          {showChallans && (
            <li>
              <button
                className={`sidebar-item-btn ${activeTab === "challans" ? "active" : ""}`}
                onClick={() => setActiveTab("challans")}
              >
                🚚 Sales Challans
              </button>
            </li>
          )}
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile">
            <span className="profile-name">@{user.username}</span>
            <span className="profile-role">{user.role} Account</span>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: "8px 12px" }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === "crm" && showCrm && (
          <CRMPage token={token} userRole={user.role} />
        )}
        {activeTab === "inventory" && showInventory && (
          <InventoryPage token={token} userRole={user.role} />
        )}
        {activeTab === "challans" && showChallans && (
          <ChallanPage token={token} userRole={user.role} />
        )}
      </main>
    </div>
  );
}
