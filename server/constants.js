// Shared constants. Keeping them in one place means the API, the validation
// rules, and the tests all agree on what a "valid" role, category, or priority is.

const ROLES = ['requester', 'technician', 'manager'];

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Account Access', 'Other'];

// Ordered lowest to highest. The index is used as the sort weight for the queue.
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const STATUSES = ['Open', 'In Progress', 'Waiting on User', 'Resolved', 'Closed'];

// Tickets in these statuses no longer need technician attention.
const FINISHED_STATUSES = ['Resolved', 'Closed'];

module.exports = { ROLES, CATEGORIES, PRIORITIES, STATUSES, FINISHED_STATUSES };
