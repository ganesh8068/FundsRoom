import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("crm");

  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Pick default active tab based on role
        if (data.user.role === "Warehouse") {
          setActiveTab("inventory");
        } else {
          setActiveTab("crm");
        }
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch (err) {
      setLoginError("Could not connect to backend server.");
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Auto-switch tab if role doesn't have access to activeTab
  useEffect(() => {
    if (user) {
      if (user.role === "Warehouse" && activeTab === "crm") {
        setActiveTab("inventory");
      }
    }
  }, [user]);

  if (!token || !user) {
    return (
      <LoginPage
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        loginError={loginError}
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <DashboardPage
      user={user}
      token={token}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      handleLogout={handleLogout}
    />
  );
}

export default App;
