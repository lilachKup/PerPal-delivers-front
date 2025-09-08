import React, { useState } from 'react';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import './AuthTabs.css';

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState(
    new URLSearchParams(window.location.search).get('tab') || 'login'
  );

  return (
    <div className="auth-tabs-container">
      <div className="tab-header">
        <div
          className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
          onClick={() => setActiveTab('signup')}
        >
          Sign Up
        </div>
        <div
          className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          Login
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'signup' && <RegisterForm />}
        {activeTab === 'login' && <LoginForm />}
      </div>
    </div>
  );
}
