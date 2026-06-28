const Ticket = require('../model/Ticket');
const User = require('../model/User');
const { uploadFileToS3, uploadMetadataToS3 } = require('../utils/s3Uploader');
const { sendTicketEmail, sendUserConfirmationEmail, sendResolutionEmail } = require('../utils/mailer');
const classifyTicket = require('../utils/aiClassifier');

exports.getAllTickets = async (req,res) =>{
    try{
        const tickets = await Ticket.find({});

        res.status(200).json({
            tickets
        });
    }
    catch(error){
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

        res.status(200).json({
            message:'ticket found',
            ticket
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

        const ticket = await Ticket.findOneAndUpdate(
            { ticketId: req.params.id },
            { status, priority, assignedTo },
            { new: true, runValidators: true }
        );

        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket not found'
            });
        }

        if (status === 'done') {
            const user = await User.findById(ticket.raisedBy);
            if (user) {
                sendResolutionEmail(ticket, user.email, user.name).catch(err => {
                    console.error('Resolution email failed:', err.message);
                });
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
const ticket = await Ticket.findOneAndDelete({ ticketId: req.params.id });

        if (!ticket) {
            return res.status(404).json({ 
                message: 'Ticket not found' });
        }

        res.status(200).json({ 
            message: 'Ticket deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', error: error.message });
    }
};