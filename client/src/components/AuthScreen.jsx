import { useState } from 'react';
import { api, setToken } from '../api.js';

const DEMO_PASSWORD = 'HelpDesk123!';
const DEMOS = [
  { label: 'Requester', email: 'requester@helpdeskhq.dev' },
  { label: 'Technician', email: 'tech@helpdeskhq.dev' },
  { label: 'Manager', email: 'manager@helpdeskhq.dev' },
];

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setMessage('');
  }

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setBusy(true);
    try {
      const result = isRegister
        ? await api.register(form)
        : await api.login({ email: form.email, password: form.password });
      setToken(result.token);
      onLogin(result.user);
    } catch (err) {
      setErrors(err.fields || {});
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <div className="card auth-card">
        <h1 className="brand">HelpDesk<span>HQ</span></h1>
        <p className="muted">Get IT help fast, and always know where your request stands.</p>

        <h2>{isRegister ? 'Create your account' : 'Log in'}</h2>

        <form onSubmit={submit} noValidate>
          {isRegister && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" value={form.name} onChange={update('name')} autoComplete="name" />
              {errors.name && <p className="error">{errors.name}</p>}
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
            />
            {errors.email && <p className="error">{errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            {isRegister && <p className="hint">At least 8 characters.</p>}
            {errors.password && <p className="error">{errors.password}</p>}
          </div>

          {message && Object.keys(errors).length === 0 && (
            <p className="error banner" role="alert">{message}</p>
          )}

          <button className="btn primary full" disabled={busy}>
            {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="switch">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <button className="link" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Log in' : 'Create an account'}
          </button>
        </p>

        {!isRegister && (
          <div className="demo">
            <p className="muted small">Try a demo account (fills the form for you):</p>
            <div className="demo-buttons">
              {DEMOS.map((d) => (
                <button
                  key={d.email}
                  className="btn small"
                  type="button"
                  onClick={() => setForm({ name: '', email: d.email, password: DEMO_PASSWORD })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
