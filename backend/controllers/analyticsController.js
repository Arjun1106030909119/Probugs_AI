const Ticket = require('../models/Ticket');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalTickets = await Ticket.countDocuments();
        const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
        const openTickets = await Ticket.countDocuments({ status: { $in: ['Open', 'In Progress'] } });

        // SLA Compliance (Mocked logic for demo)
        const slaCompliant = await Ticket.countDocuments({ isEscalated: false });
        const slaComplianceRate = totalTickets > 0 ? (slaCompliant / totalTickets) * 100 : 100;

        // AI Automation Rate
        const aiAutoResolved = await Ticket.countDocuments({ aiAutoResolved: true });
        const aiAutomationRate = totalTickets > 0 ? (aiAutoResolved / totalTickets) * 100 : 100;

        // Category Distribution
        const categoryStats = await Ticket.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Correction History (Last 5)
        const corrections = await Ticket.find({ isAiCorrected: true })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate('user', 'name');

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalTickets,
                    openTickets,
                    slaCompliance: slaComplianceRate.toFixed(1),
                    aiAutomation: aiAutomationRate.toFixed(1)
                },
                categoryStats,
                corrections
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
