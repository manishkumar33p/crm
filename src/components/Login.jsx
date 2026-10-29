import React, { useState } from 'react';
import './Login.css';

const ROLES = [
  { id:'superadmin', icon:'✦', title:'Super Admin', desc:'Platform & client companies' },
  { id:'owner', icon:'⌂', title:'Company Owner', desc:'Full company CRM access' },
  { id:'employee', icon:'♙', title:'Employee', desc:'Your assigned daily work' }
];

export default function Login({ onLogin, authMessage, authLoading }) {
  const [role, setRole] = useState('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return <main className="login-page">
    <section className="login-left">
      <div className="brand login-brand"><div className="brand-logo">N<span>+</span></div><div className="brand-text"><strong>NISS TECHNOLOGY<span>.</span></strong><small>REAL ESTATE CRM</small></div></div>
      <div className="login-hero">
        <span className="pill light">RIHAOS REALTOR WORKSPACE</span>
        <h1>Every opportunity.<br/><em>One smarter workspace.</em></h1>
        <p>A connected real-estate CRM for leads, properties, team operations, site visits and sales — built by NISS Technology.</p>
        <div className="hero-points"><span>✓ Lead pipeline & follow-ups</span><span>✓ Property & booking workflow</span><span>✓ Attendance, payroll & reports</span></div>
      </div>
      <div className="login-decoration"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="float-card card-one"><span className="mini-icon purple">↗</span><div><small>Lead management</small><b>All in one place</b></div></div><div className="float-card card-two"><span className="mini-icon green">✓</span><div><small>Live data</small><b>Connected to Firebase</b></div></div></div>
      <div className="login-foot">Secure sign-in · Role-based workspace · Firebase connected</div>
    </section>
    <section className="login-right">
      <form className="login-box" onSubmit={e=>{e.preventDefault();onLogin(role,email,password);}}>
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Sign in to your CRM</h2>
        <p>Select your access type, then enter the account details created for you.</p>
        <div className="role-cards">{ROLES.map(r=><button key={r.id} type="button" className={role===r.id?'chosen':''} onClick={()=>setRole(r.id)}><span>{r.icon}</span><b>{r.title}</b><small>{r.desc}</small></button>)}</div>
        <label className="login-input-label">Email address<input autoComplete="username" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required/></label>
        <label className="login-input-label">Password<div className="password-wrap"><input autoComplete="current-password" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></div></label>
        {authMessage && <div className="login-error" role="alert">{authMessage}</div>}
        <button className="btn primary login-btn" disabled={authLoading}>{authLoading?'Checking session…':'Secure sign in'} <span>→</span></button>
        <div className="login-warning"><span>ⓘ</span><p><b>First-time setup?</b><br/>Create the account in Firebase Authentication and add its matching <code>users/{'{UID}'}</code> role profile in Firestore. See <code>SETUP_HINDI.txt</code>.</p></div>
        <div className="login-bottom-note">NISS TECHNOLOGY <span>•</span> RIHAOS REALTOR</div>
      </form>
    </section>
  </main>;
}
