const Ticket = require('../models/Ticket');

/**
 * SLA Service - Checks tickets for SLA breaches and escalates.
 */
exports.checkSLAs = async (io) => {
    const now = new Date();

    // Find tickets that are not resolved/closed and have breached SLA
    const breachedTickets = await Ticket.find({
        status: { $nin: ['Resolved', 'Closed'] },
        slaDeadline: { $lt: now },
        isEscalated: false
    });

    for (const ticket of breachedTickets) {
        ticket.isEscalated = true;
        ticket.aiSlaRisk = 1.0; // Max risk

        // In a real system, we'd send notifications
        console.log(`[SLA ESCALATION] Ticket ${ticket.ticketId} has reached breach! Escalating...`);

        await ticket.save();

        // Emit real-time update
        if (io) {
            io.emit('ticket_updated', ticket);
            io.emit('system_log', {
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                type: 'warning',
                msg: `SLA Breach Protocol: Incident #${ticket.ticketId} has exceeded resolution threshold`
            });
        }
    }
};

/**
 * Calculate SLA Deadline based on priority.
 */
exports.calculateDeadline = (priority) => {
    const now = new Date();
    switch (priority) {
        case 'Urgent': return new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        case 'High': return new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
        case 'Medium': return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        default: return new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
    }
};
