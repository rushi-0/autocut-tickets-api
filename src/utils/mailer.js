const nodemailer = require('nodemailer');
const emailRoutes = require('../emailRoutes');

const dns = require('dns');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    lookup: (hostname, options, callback) => {
        dns.resolve4(hostname, (err, addresses) => {
            if (err) return callback(err);
            callback(null, addresses[0], 4);
        });
    }
});

const escapeHtml = (str = '') => String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));

const sendTicketEmail = async (ticket) => {
    const recipientEmail = emailRoutes[ticket.category];

    if (!recipientEmail) {
        console.warn(`No email found for category: ${ticket.category}`);
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: `New Ticket: [${ticket.ticketId}] - ${ticket.category}`,
        html: `
            <h2>New Ticket Assigned</h2>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Title:</strong> ${escapeHtml(ticket.title)}</p>
            <p><strong>Description:</strong> ${escapeHtml(ticket.description)}</p>
            <p><strong>Category:</strong> ${escapeHtml(ticket.category)}</p>
            <p>Please review and resolve this issue at the earliest opportunity.</p>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${recipientEmail} for ticket ${ticket.ticketId}`);
};

const sendUserConfirmationEmail = async (ticket, userEmail, userName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `We received your request — Ticket #${ticket.ticketId}`,
        html: `
            <h2>Thank you for reaching out, ${escapeHtml(userName)}!</h2>
            <p>We have received your request and our team is looking into it.</p>
            
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Title:</strong> ${escapeHtml(ticket.title)}</p>
            <p><strong>Description:</strong> ${escapeHtml(ticket.description)}</p>
            <p><strong>Status:</strong> Open</p>

            <p>If you need immediate assistance, please contact our helpline at: <strong>${process.env.EMAIL_USER}</strong></p>
            
            <p>We will get back to you shortly.</p>
            <br/>
            <p>Team Autocut Support</p>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${userEmail} for ticket ${ticket.ticketId}`);
};

const sendResolutionEmail = async (ticket, userEmail, userName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Your issue has been resolved — Ticket #${ticket.ticketId}`,
        html: `
            <h2>Great news, ${escapeHtml(userName)}!</h2>
            <p>Your ticket has been resolved by our support team.</p>
            
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Title:</strong> ${escapeHtml(ticket.title)}</p>
            <p><strong>Description:</strong> ${escapeHtml(ticket.description)}</p>
            <p><strong>Status:</strong> Resolved</p>

            <p>We hope your issue has been fully addressed. If you still face any problems, feel free to raise a new ticket or contact us at: <strong>${process.env.EMAIL_USER}</strong></p>
            
            <p>Thank you for reaching out to us.</p>
            <br/>
            <p>Team Autocut Support</p>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Resolution email sent to ${userEmail} for ticket ${ticket.ticketId}`);
};

module.exports = { transporter, sendTicketEmail, sendUserConfirmationEmail, sendResolutionEmail };
