// Service layer: business rules for tickets. Keeping these out of the route
// handlers separates the data layer, business logic, and HTTP layer.

const { Ticket, User } = require('../models');
const { HttpError } = require('../errors');
const { CATEGORIES, PRIORITIES, FINISHED_STATUSES } = require('../constants');

const STAFF_ROLES = ['technician', 'manager'];

// ---------- pure functions (no database, easy to unit test) ----------

function validateTicketInput(input = {}) {
  const errors = {};
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const category = input.category;
  const priority = input.priority;

  if (!title) errors.title = 'Title is required.';
  else if (title.length > 120) errors.title = 'Title must be 120 characters or fewer.';

  if (!description) errors.description = 'Description is required.';
  else if (description.length > 5000) errors.description = 'Description is too long.';

  if (!category) errors.category = 'Category is required.';
  else if (!CATEGORIES.includes(category)) errors.category = 'Choose a valid category.';

  if (!priority) errors.priority = 'Urgency is required.';
  else if (!PRIORITIES.includes(priority)) errors.priority = 'Choose a valid urgency.';

  return { errors, value: { title, description, category, priority } };
}

// Higher number = more urgent. Unknown values sort last.
function priorityWeight(priority) {
  return PRIORITIES.indexOf(priority);
}

// Queue order: most urgent first, then oldest first within the same urgency.
function sortQueue(tickets) {
  return [...tickets].sort((a, b) => {
    const byPriority = priorityWeight(b.priority) - priorityWeight(a.priority);
    if (byPriority !== 0) return byPriority;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function isStaff(user) {
  return STAFF_ROLES.includes(user.role);
}

function serializeTicket(ticket) {
  const plain = typeof ticket.toJSON === 'function' ? ticket.toJSON() : ticket;
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    category: plain.category,
    priority: plain.priority,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    requester: plain.requester ? { id: plain.requester.id, name: plain.requester.name } : null,
    assignee: plain.assignee ? { id: plain.assignee.id, name: plain.assignee.name } : null,
  };
}

// ---------- database-backed operations ----------

const withPeople = [
  { model: User, as: 'requester', attributes: ['id', 'name'] },
  { model: User, as: 'assignee', attributes: ['id', 'name'] },
];

async function createTicket(user, input) {
  const { errors, value } = validateTicketInput(input);
  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, 'Please fix the highlighted fields.', errors);
  }
  const ticket = await Ticket.create({ ...value, status: 'Open', requesterId: user.id });
  const full = await Ticket.findByPk(ticket.id, { include: withPeople });
  return serializeTicket(full);
}

// A requester's own tickets, newest first.
async function listMyTickets(user) {
  const tickets = await Ticket.findAll({
    where: { requesterId: user.id },
    include: withPeople,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  });
  return tickets.map(serializeTicket);
}

// Requesters can only open their own tickets; staff can open any.
// A requester asking for someone else's ticket gets "not found", so the
// response does not even confirm that the ticket exists.
async function getTicketForUser(user, id) {
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId < 1) {
    throw new HttpError(404, 'Ticket not found.');
  }
  const ticket = await Ticket.findByPk(ticketId, { include: withPeople });
  if (!ticket || (!isStaff(user) && ticket.requesterId !== user.id)) {
    throw new HttpError(404, 'Ticket not found.');
  }
  return serializeTicket(ticket);
}

// Unresolved tickets for technicians, most urgent and oldest first.
async function getQueue() {
  const tickets = await Ticket.findAll({ include: withPeople });
  const open = tickets.filter((t) => !FINISHED_STATUSES.includes(t.status));
  return sortQueue(open.map(serializeTicket));
}

module.exports = {
  validateTicketInput,
  priorityWeight,
  sortQueue,
  isStaff,
  serializeTicket,
  createTicket,
  listMyTickets,
  getTicketForUser,
  getQueue,
};
