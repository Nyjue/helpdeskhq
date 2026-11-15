import { useState } from 'react';
import { api } from '../api.js';
import { CATEGORIES, PRIORITIES, ticketNumber } from '../format.js';

const EMPTY = { title: '', description: '', category: '', priority: 'Medium' };

export default function TicketForm({ onViewTicket, onViewMine }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setBusy(true);
    try {
      const { ticket } = await api.createTicket(form);
      setCreated(ticket);
      setForm(EMPTY);
    } catch (err) {
      setErrors(err.fields || {});
      setMessage(Object.keys(err.fields || {}).length ? '' : err.message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <section className="card">
        <h2>Ticket submitted</h2>
        <p className="success banner" role="status">
          Your ticket number is <strong>{ticketNumber(created.id)}</strong>. We will update the
          status as the IT team works on it.
        </p>
        <p><strong>{created.title}</strong></p>
        <div className="row">
          <button className="btn primary" onClick={() => onViewTicket(created.id)}>View ticket</button>
          <button className="btn" onClick={() => setCreated(null)}>Submit another</button>
          <button className="btn" onClick={onViewMine}>My tickets</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Submit a ticket</h2>
      <p className="muted">Tell us what is wrong. The more detail, the faster we can help.</p>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={form.title}
            onChange={update('title')}
            maxLength={120}
            placeholder="e.g. Cannot connect to the office Wi-Fi"
          />
          {errors.title && <p className="error">{errors.title}</p>}
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={update('category')}>
              <option value="">Choose one...</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            {errors.category && <p className="error">{errors.category}</p>}
          </div>

          <div className="field">
            <label htmlFor="priority">Urgency</label>
            <select id="priority" value={form.priority} onChange={update('priority')}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
            {errors.priority && <p className="error">{errors.priority}</p>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={5}
            value={form.description}
            onChange={update('description')}
            placeholder="What happened, what you expected, and anything you already tried."
          />
          {errors.description && <p className="error">{errors.description}</p>}
        </div>

        {message && <p className="error banner" role="alert">{message}</p>}

        <button className="btn primary" disabled={busy}>
          {busy ? 'Submitting...' : 'Submit ticket'}
        </button>
      </form>
    </section>
  );
}
