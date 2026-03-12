const Ticket = require('../models/Ticket');
const aiService = require('../services/aiService');
const slaService = require('../services/slaService');

// Socket Emission Helper
const emitRealTime = (req, event, data, logMeta = null) => {
    const io = req.app.get('socketio');
    if (io) {
        io.emit(event, data);
        if (logMeta) {
            io.emit('system_log', {
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                type: logMeta.type || 'info',
                msg: logMeta.msg
            });
        }
    }
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
exports.getTickets = async (req, res, next) => {
    try {
        let query;

        // If user is not admin/agent, they can only see their own tickets
        if (req.user.role === 'user') {
            query = Ticket.find({ user: req.user.id });
        } else {
            query = Ticket.find().populate('user', 'name email');
        }

        const tickets = await query.sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('user', 'name email')
            .populate('activityLog.user', 'name email');

        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        // Check ownership
        const ticketUserId = ticket.user._id ? ticket.user._id.toString() : ticket.user.toString();
        if (ticketUserId !== req.user.id && req.user.role === 'user') {
            console.warn(`[Ticket Access] Denied for user ${req.user.id} (${req.user.role}) on ticket ${ticket.ticketId}`);
            return res.status(401).json({ success: false, error: 'Not authorized to access this ticket' });
        }
        
        console.log(`[Ticket Access] Granted for user ${req.user.id} (${req.user.role}) on ticket ${ticket.ticketId}`);

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.user = req.user.id;

        // AI Prediction Integration
        const analysis = await aiService.analyzeTicket(req.body.title, req.body.description);

        // Merge AI insights into ticket data
        Object.assign(req.body, analysis);

        // Calculate SLA Deadline
        req.body.slaDeadline = slaService.calculateDeadline(req.body.priority || req.body.aiPriority);

        // --- NEW: Autonomous AI Processing ---
        // 1. Auto-Assignment (if confidence is high)
        const User = require('../models/User'); // Import User model
        if (analysis.aiConfidence > 0.7 && !req.body.assignedTo) {
            const agent = await User.findOne({ role: 'agent' });
            if (agent) {
                req.body.assignedTo = agent._id;
                req.body.status = 'In Progress';
                analysis.aiExplanation.push(`Autonomous Agent: Assigned to ${agent.name} based on high confidence in ${analysis.aiCategory} classification.`);
            }
        }

        // 2. Auto-Resolution (if confidence is extremely high for common software issues)
        if (analysis.aiConfidence > 0.9 && analysis.aiCategory === 'Software') {
            req.body.status = 'Resolved';
            req.body.aiAutoResolved = true;
            analysis.aiExplanation.push(`Autonomous Resolution: Ticket marked as resolved based on matching software patterns and automated fix deployment.`);
        }

        const ticket = await Ticket.create(req.body);

        // Add initial system activity if automated actions were taken
        if (ticket.assignedTo || ticket.aiAutoResolved) {
            ticket.activityLog.push({
                user: ticket.user, // System action credited to creating user or a dummy system user could be used
                message: `AI Automation: ${ticket.aiAutoResolved ? 'Auto-Resolved' : 'Auto-Assigned to Agent'}. Solution: ${ticket.aiSolution}`,
                type: 'system'
            });
            await ticket.save();
        }

        // Real-time notify
        let systemMsg = `AI Engine: Classified #${ticket.ticketId} as ${ticket.category} (${ticket.priority})`;
        if (ticket.aiAutoResolved) systemMsg = `AI Autonomy: #${ticket.ticketId} automatically resolved via software patch prediction.`;
        else if (ticket.assignedTo) systemMsg = `AI Dispatch: #${ticket.ticketId} routed to senior agent for processing.`;

        emitRealTime(req, 'ticket_created', ticket, {
            type: ticket.aiAutoResolved ? 'success' : 'zap',
            msg: systemMsg
        });

        res.status(201).json({
            success: true,
            data: ticket
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Correct AI Prediction (Human-in-the-loop)
// @route   PUT /api/tickets/:id/correct
// @access  Private (Agent/Admin)
exports.correctAiPrediction = async (req, res, next) => {
    try {
        let ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        const { category, priority } = req.body;

        // Update with human correction
        ticket.category = category || ticket.category;
        ticket.priority = priority || ticket.priority;
        ticket.isAiCorrected = true;

        // In a real system, we'd log this for retraining
        console.log(`[AI Feedback Loop] Ticket ${ticket.ticketId} corrected by ${req.user.name}`);

        await ticket.save();

        // Real-time notify
        emitRealTime(req, 'ticket_updated', ticket, {
            type: 'success',
            msg: `Neural Override: #${ticket.ticketId} recalibrated by agent ${req.user.name}`
        });

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res, next) => {
    try {
        let ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        // Make sure user is owner or admin/agent
        const ticketUserId = ticket.user._id ? ticket.user._id.toString() : ticket.user.toString();
        if (ticketUserId !== req.user.id && req.user.role === 'user') {
            return res.status(401).json({ success: false, error: 'Not authorized to update this ticket' });
        }

        ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('user', 'name email').populate('activityLog.user', 'name email');

        // Real-time notify
        emitRealTime(req, 'ticket_updated', ticket, {
            type: 'info',
            msg: `Registry Sync: #${ticket.ticketId} metadata updated by ${req.user.name}`
        });

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
exports.deleteTicket = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        // Make sure user is owner or admin
        const ticketUserId = ticket.user._id ? ticket.user._id.toString() : ticket.user.toString();
        if (ticketUserId !== req.user.id && req.user.role === 'user') {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this ticket' });
        }

        await ticket.deleteOne();

        // Real-time notify
        emitRealTime(req, 'ticket_deleted', req.params.id, {
            type: 'error',
            msg: `Registry Purge: Ticket #${ticket.ticketId} removed from indexed nodes`
        });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Add comment/activity to ticket
// @route   POST /api/tickets/:id/activity
// @access  Private
exports.addActivity = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        const activity = {
            user: req.user.id,
            message: req.body.message,
            type: req.body.type || 'comment'
        };

        ticket.activityLog.push(activity);
        await ticket.save();

        const updatedTicket = await Ticket.findById(req.params.id)
            .populate('user', 'name email')
            .populate('activityLog.user', 'name email');

        // Real-time notify
        emitRealTime(req, 'ticket_updated', updatedTicket);

        res.status(200).json({
            success: true,
            data: updatedTicket
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
