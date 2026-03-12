const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Blocked', 'Resolved', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Low'
    },
    category: {
        type: String,
        enum: ['Hardware', 'Software', 'Network', 'Access', 'Cloud', 'HR', 'Security', 'Infrastructure', 'Documentation', 'Unknown'],
        default: 'Unknown'
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    // AI Predicted Fields
    aiCategory: String,
    aiPriority: String,
    aiConfidence: Number,
    aiSlaRisk: Number,
    aiExplanation: [String],
    aiSolution: String,
    aiAutoResolved: {
        type: Boolean,
        default: false
    },
    isAiCorrected: {
        type: Boolean,
        default: false
    },
    // SLA Fields
    slaDeadline: Date,
    isEscalated: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    activityLog: [{
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        message: String,
        type: {
            type: String,
            enum: ['comment', 'status_change', 'priority_change', 'ai_correction', 'system'],
            default: 'comment'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
});

// Generate Ticket ID before saving
ticketSchema.pre('save', async function (next) {
    if (!this.ticketId) {
        const count = await this.constructor.countDocuments();
        this.ticketId = `TK-${1000 + count}`;
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
