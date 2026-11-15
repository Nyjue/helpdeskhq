// Models and their relationships:
//   one User (requester) submits many Tickets
//   one User (technician) can be assigned many Tickets (used in Sprint 2)

const User = require('./User');
const Ticket = require('./Ticket');

User.hasMany(Ticket, { foreignKey: 'requesterId', as: 'tickets' });
Ticket.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });

User.hasMany(Ticket, { foreignKey: 'assigneeId', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });

module.exports = { User, Ticket };
