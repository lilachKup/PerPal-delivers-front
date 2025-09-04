// src/components/TopBar.jsx
import React from "react";
import { CognitoUserPool } from "amazon-cognito-identity-js";
import "./TopBar.css";

const poolData = {
  UserPoolId: "us-east-1_TpeA6BAZD",
  ClientId: "56ic185te584076fcsarbqq93m"
};

const userPool = new CognitoUserPool(poolData);

const TopBar = () => {
  const handleLogout = () => {
    // 1. מחיקת מידע מה־localStorage
    localStorage.removeItem("pp_user");
    sessionStorage.clear();

    // 2. יצירת משתמש נוכחי (אם יש) ו־signOut
    const user = userPool.getCurrentUser();
    if (user) {
      user.signOut(); // מנתק מהסשן המקומי
    }

    window.location.href = "/login";
  };

  return (
    <div className="topbar">
      <h2 className="logo">PrepPal</h2>
      <div className="actions">
        <button onClick={handleLogout}>Logout</button>
        <button onClick={() => alert("Profile pressed")}>Profile</button>
      </div>
    </div>
  );
};

export default TopBar;
