const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ticketSchema = new mongoose.Schema({
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ticketId: {
        type: String,
        required: true,
        unique: true,
        default: uuidv4
    },
    title: {
        type: String,
        required:true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'done'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high']
    },
    category: {
        type: String
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

module.exports = mongoose.model('Ticket', ticketSchema);