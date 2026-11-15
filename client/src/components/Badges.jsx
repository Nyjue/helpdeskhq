// Small coloured labels. The text always says the value, so colour is never
// the only way to tell priorities apart.

export function PriorityBadge({ priority }) {
  return <span className={`badge priority-${priority.toLowerCase()}`}>{priority}</span>;
}

export function StatusBadge({ status }) {
  return <span className="badge status">{status}</span>;
}
