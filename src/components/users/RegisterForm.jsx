import React, { useState } from 'react';
import {
  CognitoUserPool,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import './RegisterForm.css';

const poolData = {
  UserPoolId: 'us-east-1_si88xOPAL',
  ClientId: '2mi6jtcm5oj2d60p23rut5kbcc'
};

const userPool = new CognitoUserPool(poolData);

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const sanitizeText = (text) => {
    // מסיר תווים שאינם אותיות, רווחים, מקפים או גרש (אם תרצי להסיר גם רווחים – תגידי לי)
    return text.replace(/[^A-Za-zא-ת\s'-]/g, '').trim();
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setMessage('');

    if (!/^\d{9}$/.test(phoneNumber)) {
      setMessage("Invalid phone number (must be 9 digits)");
      return;
    }

    // ניקוי שמות
    const cleanFirstName = sanitizeText(firstName);
    const cleanLastName = sanitizeText(lastName);

    const attributes = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'phone_number', Value: `+972${phoneNumber}` }),
      new CognitoUserAttribute({ Name: 'given_name', Value: cleanFirstName }),
      new CognitoUserAttribute({ Name: 'family_name', Value: cleanLastName })
    ];

    console.log("Attributes being sent to Cognito:");
    attributes.forEach(attr => {
      console.log(`Name: ${attr.getName()}, Value: ${attr.getValue()}`);
    });
    userPool.signUp(email, password, attributes, null, (err, result) => {
      if (err) {
        console.error(err);
        setMessage(err.message || 'Registration failed');
        if (err.code === 'UsernameExistsException') {
          setShowLoginButton(true);
        }
        return;
      }

      console.log('Registered successfully', result);
      setMessage('Registered successfully! Redirecting to confirm…');
      setRegistrationSuccess(true);

      setTimeout(() => {
        window.location.href = `/confirm?email=${encodeURIComponent(email)}`;
      }, 1000);
    });
  };

  const handleLoginRedirect = () => {
    window.location.href = '/?tab=login';
  };

  return (
    <form className="register-form" onSubmit={handleRegister}>
      <h2 className="form-title">Delivery Sign Up</h2>

      <label>Email:</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="form-input"
        required
      />

      <label>Password:</label>
      <div className="password-container">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input password-input"
          required
        />
        <span
          className="toggle-password"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "🙈" : "👁"}
        </span>
      </div>

      <label>Phone Number:</label>
      <div className="phone-container">
        <span className="phone-prefix">+972</span>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
          maxLength={9}
          className="phone-input"
          required
        />
      </div>

      <label>Given Name:</label>
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="form-input"
        required
      />

      <label>Family Name:</label>
      <input
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="form-input"
        required
      />

      <button type="submit" className="submit-btn">Sign Up</button>

      {message && <p className="form-message">{message}</p>}

      {showLoginButton && (
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button type="button" className="login-btn" onClick={handleLoginRedirect}>
            Go to Login
          </button>
        </div>
      )}

      {registrationSuccess && (
        <p className="form-message">Please check your email to confirm</p>
      )}
    </form>
  );
}
