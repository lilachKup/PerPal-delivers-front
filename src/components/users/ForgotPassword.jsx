import React, { useState, useEffect } from 'react';
import { CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';
import './RegisterForm.css';

const poolData = {
  UserPoolId: 'us-east-1_si88xOPAL',
  ClientId: '2mi6jtcm5oj2d60p23rut5kbcc'
};

const userPool = new CognitoUserPool(poolData);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState('request'); // 'request' | 'confirm'
  const [code, setCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('email');
    if (fromUrl) setEmail(fromUrl);
  }, []);

  const getUser = () => new CognitoUser({ Username: email, Pool: userPool });

  const requestCode = (e) => {
    e.preventDefault(); setMsg(''); setBusy(true);
    getUser().forgotPassword({
      onSuccess: () => { setBusy(false); setMsg('✔ Code sent. Check your email.'); setPhase('confirm'); },
      onFailure: (err) => { setBusy(false); setMsg(`❌ ${err?.message || 'Failed to send code'}`); }
    });
  };

  const confirmNewPassword = (e) => {
    e.preventDefault(); setMsg(''); setBusy(true);
    getUser().confirmPassword(code, newPwd, {
      onSuccess: () => {
        setBusy(false); setMsg('✔ Password reset. Redirecting to login…');
        setTimeout(() => { window.location.href = '/?tab=login'; }, 800);
      },
      onFailure: (err) => { setBusy(false); setMsg(`❌ ${err?.message || 'Failed to reset password'}`); }
    });
  };

  return (
    <div className="register-form">
      <h2 className="form-title">Reset Password</h2>

      {phase === 'request' && (
        <form onSubmit={requestCode}>
          <input className="form-input" type="email" placeholder="Email"
                 value={email} onChange={e=>setEmail(e.target.value)} required />
          <button className="submit-btn" type="submit" disabled={busy}>{busy?'Sending…':'Send Code'}</button>
          <p className="form-message">{msg}</p>
        </form>
      )}

      {phase === 'confirm' && (
        <form onSubmit={confirmNewPassword}>
          <input className="form-input" type="text" placeholder="Verification code"
                 value={code} onChange={e=>setCode(e.target.value)} required />

          <div className="password-container">
            <input className="form-input password-input"
                   type={show ? 'text' : 'password'}
                   placeholder="New Password"
                   value={newPwd}
                   onChange={e=>setNewPwd(e.target.value)}
                   required autoComplete="new-password" />
            <span className="toggle-password" onClick={()=>setShow(s=>!s)}
                  title={show?'Hide password':'Show password'}>
              {show ? '🙈' : '👁'}
            </span>
          </div>

          <button className="submit-btn" type="submit" disabled={busy}>
            {busy?'Updating…':'Confirm new password'}
          </button>
          <p className="form-message">{msg}</p>
        </form>
      )}
    </div>
  );
}
