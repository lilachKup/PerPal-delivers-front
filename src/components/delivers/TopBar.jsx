import React from "react";
import { CognitoUserPool } from "amazon-cognito-identity-js";
import "./TopBar.css";
import prepal_logo from "../utils/prepal_logo.png";


const poolData = {
  UserPoolId: "us-east-1_TpeA6BAZD",
  ClientId: "56ic185te584076fcsarbqq93m"
};

const userPool = new CognitoUserPool(poolData);

const TopBar = () => {
  const handleLogout = () => {
    localStorage.removeItem("pp_user");
    sessionStorage.clear();

    const user = userPool.getCurrentUser();
    if (user) {
      user.signOut(); 
    }

    window.location.href = "/login";
  };

  return (
    <div className="topbar">
      <div className="brand">
        <h2 className="logo">PrePal</h2>
        <img src={prepal_logo} alt="PrePal Logo" className="logo-image" />
      </div>      <div className="actions">
        <button onClick={handleLogout}>Logout</button>
        <button onClick={() => alert("Profile pressed")}>Profile</button>
      </div>
    </div>
  );
};

export default TopBar;
