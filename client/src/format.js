export const CATEGORIES = ['Hardware', 'Software', 'Network', 'Account Access', 'Other'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// Ticket 7 -> "HD-0007"
export const ticketNumber = (id) => `HD-${String(id).padStart(4, '0')}`;

export function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
