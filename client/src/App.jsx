import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import AuthScreen from './components/AuthScreen.jsx';
import TicketForm from './components/TicketForm.jsx';
import MyTickets from './components/MyTickets.jsx';
import TicketDetail from './components/TicketDetail.jsx';
import Queue from './components/Queue.jsx';

const isStaff = (user) => user.role === 'technician' || user.role === 'manager';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [view, setView] = useState('submit'); // 'submit' | 'mine' | 'queue' | 'detail'
  const [detailId, setDetailId] = useState(null);
  const [backTo, setBackTo] = useState('mine');

  // Restore the session after a page refresh.
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((data) => {
        setUser(data.user);
        setView(isStaff(data.user) ? 'queue' : 'submit');
      })
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  function handleLogin(loggedIn) {
    setUser(loggedIn);
    setView(isStaff(loggedIn) ? 'queue' : 'submit');
  }

  function logout() {
    setToken(null);
    setUser(null);
    setView('submit');
  }

  function openTicket(id, from) {
    setDetailId(id);
    setBackTo(from);
    setView('detail');
  }

  if (checking) return <p className="center muted">Loading...</p>;
  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const tabs = [
    { id: 'submit', label: 'Submit a ticket' },
    { id: 'mine', label: 'My tickets' },
    ...(isStaff(user) ? [{ id: 'queue', label: 'Queue' }] : []),
  ];
  const activeTab = view === 'detail' ? backTo : view;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand small">HelpDesk<span>HQ</span></span>
          <div className="who">
            <span>
              {user.name} <span className="role">{user.role}</span>
            </span>
            <button className="btn small" onClick={logout}>Log out</button>
          </div>
        </div>
        <nav className="tabs" aria-label="Main">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab ${activeTab === t.id ? 'active' : ''}`}
              aria-current={activeTab === t.id ? 'page' : undefined}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container">
        {view === 'submit' && (
          <TicketForm
            onViewTicket={(id) => openTicket(id, 'mine')}
            onViewMine={() => setView('mine')}
          />
        )}
        {view === 'mine' && (
          <MyTickets onViewTicket={(id) => openTicket(id, 'mine')} onSubmit={() => setView('submit')} />
        )}
        {view === 'queue' && isStaff(user) && (
          <Queue onViewTicket={(id) => openTicket(id, 'queue')} />
        )}
        {view === 'detail' && <TicketDetail id={detailId} onBack={() => setView(backTo)} />}
      </main>
    </>
  );
}
