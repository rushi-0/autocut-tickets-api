const Ticket = require('../model/Ticket');
const User = require('../model/User');
const { uploadFileToS3, uploadMetadataToS3, getAttachmentUrl } = require('../utils/s3Uploader');
const { sendTicketEmail, sendUserConfirmationEmail, sendResolutionEmail } = require('../utils/mailer');
const classifyTicket = require('../utils/aiClassifier');

const isStaffOrAdmin = (user) => user.role === 'staff' || user.role === 'admin';

exports.getAllTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // staff/admin see everything; regular users only see their own
        const filter = isStaffOrAdmin(req.user) ? {} : { raisedBy: req.user.id };

        const tickets = await Ticket.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Ticket.countDocuments(filter);

        res.status(200).json({
            tickets,
            page,
            totalPages: Math.ceil(total / limit),
            totalTickets: total
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ ticketId: req.params.id });

        if (!ticket) {
            return res.status(404).json({ 
                message: 'Ticket not found' });
        }

        const ticketObj = ticket.toObject();
        if (ticketObj.attachments) {
            ticketObj.attachments = await getAttachmentUrl(ticketObj.attachments);
        }

        res.status(200).json({
            message:'ticket found',
            ticket: ticketObj
        })
    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message });
    }
};

exports.createTicket = async (req, res) => {
    try {
        const { title, description } = req.body;

                const recentDuplicate = await Ticket.findOne({
            raisedBy: req.user.id,
            title,
            description,
            createdAt: { $gte: new Date(Date.now() - 30000) } // last 30 sec
        });

        if (recentDuplicate) {
            return res.status(409).json({
                message: 'A similar ticket was just submitted. Please wait before resubmitting.',
                ticket: recentDuplicate
            });
        }

        const categories = await classifyTicket(description);

        let attachmentUrl = null;
        if (req.file) {
            attachmentUrl = await uploadFileToS3(req.file, `temp-${Date.now()}`);
        }

        if (categories.length === 1) {
            const ticket = await Ticket.create({
                title,
                description,
                category: categories[0],
                raisedBy: req.user.id,
                attachments: attachmentUrl
            });

            uploadMetadataToS3(ticket).catch(err => {
                console.error('S3 metadata upload failed:', err.message);
            });

            sendTicketEmail(ticket).catch(err => {
                console.error('Email notification failed:', err.message);
            });

            sendUserConfirmationEmail(ticket, req.user.email, req.user.name).catch(err => {
                console.error('Confirmation email failed:', err.message);
            });

            return res.status(201).json({
                message: "Ticket created successfully",
                ticket
            });
        }

        const parentTicket = await Ticket.create({
            title,
            description,
            category: "Multiple Issues",
            raisedBy: req.user.id,
            isParent: true,
            attachments: attachmentUrl
        });

        uploadMetadataToS3(parentTicket).catch(err => {
            console.error('S3 metadata upload failed:', err.message);
        });

        const childTickets = await Promise.all(
            categories.map(category =>
                Ticket.create({
                    title: `${title} - ${category}`,
                    description,
                    category,
                    raisedBy: req.user.id,
                    parentTicketId: parentTicket.ticketId,
                    attachments: attachmentUrl
                })
            )
        );

        childTickets.forEach(child => {
            sendTicketEmail(child).catch(err => {
                console.error('Email notification failed:', err.message);
            });
        });

        sendUserConfirmationEmail(parentTicket, req.user.email, req.user.name).catch(err => {
            console.error('Confirmation email failed:', err.message);
        });

        return res.status(201).json({
            message: "Ticket created successfully",
            ticket: parentTicket,
            subTickets: childTickets
        });

    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
};

exports.updateTicket = async (req, res) => {
    try {
        const { status, priority, assignedTo } = req.body;

        const ticket = await Ticket.findOne({ ticketId: req.params.id });

        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket not found'
            });
        }

        // only support staff/admins can update ticket status — owner cannot self-resolve
if (!isStaffOrAdmin(req.user)) {
    return res.status(403).json({
        message: 'Only support staff or admins can update ticket status'
    });
}

        ticket.status = status ?? ticket.status;
        ticket.priority = priority ?? ticket.priority;
        ticket.assignedTo = assignedTo ?? ticket.assignedTo;
        await ticket.save();

        if (status === 'done') {
            if (ticket.parentTicketId) {
                // this is a child ticket — only notify once ALL siblings are done
                const siblings = await Ticket.find({ parentTicketId: ticket.parentTicketId });
                const allDone = siblings.every(sibling => sibling.status === 'done');

                if (allDone) {
                    const parent = await Ticket.findOne({ ticketId: ticket.parentTicketId });

                    if (parent && parent.status !== 'done') {
                        parent.status = 'done';
                        await parent.save();

                        const user = await User.findById(parent.raisedBy);
                        if (user) {
                            sendResolutionEmail(parent, user.email, user.name).catch(err => {
                                console.error('Resolution email failed:', err.message);
                            });
                        }
                    }
                }
            } else {
                // standalone ticket, or the parent itself was updated directly
                const user = await User.findById(ticket.raisedBy);
                if (user) {
                    sendResolutionEmail(ticket, user.email, user.name).catch(err => {
                        console.error('Resolution email failed:', err.message);
                    });
                }
            }
        }

        res.status(200).json({
            message: 'Ticket updated successfully',
            ticket
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ ticketId: req.params.id });

        if (!ticket) {
            return res.status(404).json({ 
                message: 'Ticket not found' });
        }

        const isOwner = ticket.raisedBy.toString() === req.user.id;
        if (!isOwner && !isStaffOrAdmin(req.user)) {
            return res.status(403).json({
                message: 'Not authorized to delete this ticket'
            });
        }

        await ticket.deleteOne();

        res.status(200).json({ 
            message: 'Ticket deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', error: error.message });
    }
};
