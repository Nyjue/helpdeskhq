import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ticketNumber, timeAgo } from '../format.js';
import { PriorityBadge } from './Badges.jsx';

// Technician queue (US-4). The server already sorts it: most urgent first,
// then oldest first, so the screen just shows the list in the order received.
export default function Queue({ onViewTicket }) {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .queue()
      .then((data) => !cancelled && setTickets(data.tickets))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="card">
      <h2>Ticket queue</h2>
      <p className="muted">Open tickets, most urgent first, then oldest first.</p>

      {error && <p className="error banner" role="alert">{error}</p>}
      {!tickets && !error && <p className="muted">Loading the queue...</p>}
      {tickets && tickets.length === 0 && <p className="empty">The queue is empty. Nice work.</p>}

      {tickets && tickets.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Requester</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td data-label="Ticket">
                    <button className="link" onClick={() => onViewTicket(t.id)}>
                      {ticketNumber(t.id)}
                    </button>
                  </td>
                  <td data-label="Title">{t.title}</td>
                  <td data-label="Category">{t.category}</td>
                  <td data-label="Priority"><PriorityBadge priority={t.priority} /></td>
                  <td data-label="Requester">{t.requester?.name}</td>
                  <td data-label="Age">{timeAgo(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
