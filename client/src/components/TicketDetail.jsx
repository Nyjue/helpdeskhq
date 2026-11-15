import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDate, ticketNumber } from '../format.js';
import { PriorityBadge, StatusBadge } from './Badges.jsx';

export default function TicketDetail({ id, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setTicket(null);
    setError('');
    api
      .ticket(id)
      .then((data) => !cancelled && setTicket(data.ticket))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <section className="card">
      <button className="link back" onClick={onBack}>&larr; Back</button>

      {error && <p className="error banner" role="alert">{error}</p>}
      {!ticket && !error && <p className="muted">Loading ticket...</p>}

      {ticket && (
        <>
          <p className="ticket-num">{ticketNumber(ticket.id)}</p>
          <h2>{ticket.title}</h2>
          <div className="row">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="badge">{ticket.category}</span>
          </div>

          <dl className="details">
            <dt>Submitted by</dt>
            <dd>{ticket.requester?.name}</dd>
            <dt>Submitted</dt>
            <dd>{formatDate(ticket.createdAt)}</dd>
            <dt>Assigned to</dt>
            <dd>{ticket.assignee ? ticket.assignee.name : 'Not assigned yet'}</dd>
          </dl>

          <h3>Description</h3>
          <p className="description">{ticket.description}</p>
        </>
      )}
    </section>
  );
}
