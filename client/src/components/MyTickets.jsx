import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ticketNumber, timeAgo } from '../format.js';
import { PriorityBadge, StatusBadge } from './Badges.jsx';

export default function MyTickets({ onViewTicket, onSubmit }) {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .myTickets()
      .then((data) => !cancelled && setTickets(data.tickets))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="card">
      <h2>My tickets</h2>

      {error && <p className="error banner" role="alert">{error}</p>}
      {!tickets && !error && <p className="muted">Loading your tickets...</p>}

      {tickets && tickets.length === 0 && (
        <div className="empty">
          <p>You have not submitted any tickets yet.</p>
          <button className="btn primary" onClick={onSubmit}>Submit your first ticket</button>
        </div>
      )}

      {tickets && tickets.length > 0 && (
        <ul className="ticket-list">
          {tickets.map((t) => (
            <li key={t.id}>
              <button className="ticket-row" onClick={() => onViewTicket(t.id)}>
                <span className="ticket-main">
                  <span className="ticket-num">{ticketNumber(t.id)}</span>
                  <span className="ticket-title">{t.title}</span>
                </span>
                <span className="ticket-meta">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  <span className="muted small">{timeAgo(t.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
