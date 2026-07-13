const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ticketSchema = new mongoose.Schema({
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    ticketId: {
        type: String,
        required: true,
        unique: true,
        default: uuidv4
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'done'],
        default: 'open',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high']
    },
    category: {
        type: String,
        index: true
    },
    assignedTo: {
        type: String
    },
    attachments: {
        type: String
    },
    isParent: {
        type: Boolean,
        default: false
    },
    parentTicketId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

ticketSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); 


module.exports = mongoose.model('Ticket', ticketSchema);
