import React from "react";

export default function LoginPage({
  username,
  setUsername,
  password,
  setPassword,
  loginError,
  handleLogin
}) {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Operations Portal</h1>
          <p className="auth-subtitle">Mini ERP + CRM Wholesale Portal</p>
        </div>
        {loginError && <div className="alert-bar alert-bar-error">{loginError}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. admin, sales, warehouse"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
            Sign In
          </button>
        </form>
        <div style={{ marginTop: "24px", padding: "12px", background: "hsl(220, 25%, 8%)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>Default Accounts:</div>
          <div>Admin: <code>admin</code> / <code>admin123</code></div>
          <div>Sales: <code>sales</code> / <code>sales123</code></div>
          <div>Warehouse: <code>warehouse</code> / <code>warehouse123</code></div>
          <div>Accounts: <code>accounts</code> / <code>accounts123</code></div>
        </div>
      </div>
    </div>
  );
}
