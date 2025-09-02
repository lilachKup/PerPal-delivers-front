import React, { useState, useEffect } from "react";
import './RegisterForm.css';
import { CognitoUser, CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: 'us-east-1_si88xOPAL',
  ClientId: '2mi6jtcm5oj2d60p23rut5kbcc'
};

const userPool = new CognitoUserPool(poolData);

export default function ConfirmRegistration() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const emailFromUrl = new URLSearchParams(window.location.search).get("email");
    if (emailFromUrl) setEmail(emailFromUrl);
  }, []);

  const handleConfirm = () => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) setMessage(err.message);
      else {
        setMessage("Email confirmed! Redirecting to login...");
        setTimeout(() => { window.location.href = '/?tab=login'; }, 800);
      }
    });
  };

  const handleResendCode = () => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.resendConfirmationCode((err) => {
      if (err) setMessage(err.message);
      else setMessage("Verification code resent. Check your email.");
    });
  };

  return (
    <div className="register-form">
      <h2 className="form-title">Confirm Your Email</h2>
      <label>Email:</label>
      <input type="email" value={email} readOnly className="form-input" />
      <label>Verification Code:</label>
      <input type="text" value={code} onChange={e=>setCode(e.target.value)} className="form-input" />
      <button onClick={handleConfirm} className="submit-btn">Confirm</button>
      <button type="button" onClick={handleResendCode} className="resend-code-btn">Resend Code</button>
      <p className="form-message">{message}</p>
    </div>
  );
}




/*import React, { useState, useEffect } from "react";
import './RegisterForm.css';
import {
  CognitoUser,
  CognitoUserPool
} from "amazon-cognito-identity-js";
import { useAuth } from 'react-oidc-context';

const poolData = {
  UserPoolId: "us-east-1_TpeA6BAZD",
  ClientId: "56ic185te584076fcsarbqq93m"
};

const userPool = new CognitoUserPool(poolData);

export default function ConfirmRegistration() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const auth = useAuth(); 

    useEffect(() => {
    const emailFromUrl = new URLSearchParams(window.location.search).get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, []);

  const handleConfirm = () => {
    const userData = {
      Username: email,
      Pool: userPool
    };
    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        console.error(err);
        setMessage("❌ " + err.message);
      } else {
        setMessage("✔️ Email confirmed! Redirecting to login...");
        setTimeout(() => {
          auth.signinRedirect(); //
        }, 1000);
      }
    });
  };

  const handleResendCode = () => {
    const userData = {
      Username: email,
      Pool: userPool
    };
    const cognitoUser = new CognitoUser(userData);

    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) {
        console.error(err);
        setMessage("❌ " + err.message);
      } else {
        console.log('Code resent successfully');
        setMessage("✔️ Verification code resent. Check your email.");
      }
    });
  };

  return (
    <div className="register-form">
      <h2 className="form-title">Confirm Your Email</h2>

      <label>Email:</label>
      <input
        type="email"
        value={email}
        readOnly
        onChange={(e) => setEmail(e.target.value)}
        className="form-input"
      />

      <label>Verification Code:</label>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="form-input"
      />

      <button onClick={handleConfirm} className="submit-btn">Confirm</button>
      <button type="button" onClick={handleResendCode} className="resend-code-btn">Resend Code</button>
      <p className="form-message">{message}</p>
    </div>
  );
}
*/