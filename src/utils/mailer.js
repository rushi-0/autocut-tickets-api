const { Resend } = require('resend');
const emailRoutes = require('../emailRoutes');

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (str = '') => String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const sendTicketEmail = async (ticket) => {
    const recipientEmail = emailRoutes[ticket.category];
    if (!recipientEmail) {
        console.warn(`No email found for category: ${ticket.category}`);
        return;
    }

    await resend.emails.send({
        from: 'Autocut Support <onboarding@resend.dev>', // Resend's default test sender
        to: recipientEmail,
        subject: `New Ticket: [${ticket.ticketId}] - ${ticket.category}`,
        html: `
            <h2>New Ticket Assigned</h2>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Title:</strong> ${escapeHtml(ticket.title)}</p>
            <p><strong>Description:</strong> ${escapeHtml(ticket.description)}</p>
            <p><strong>Category:</strong> ${escapeHtml(ticket.category)}</p>
        `
    });
    console.log(`Email sent to ${recipientEmail} for ticket ${ticket.ticketId}`);
};

const sendUserConfirmationEmail = async (ticket, userEmail, userName) => {
    await resend.emails.send({
        from: 'Autocut Support <onboarding@resend.dev>',
        to: userEmail,
        subject: `We received your request — Ticket #${ticket.ticketId}`,
        html: `
            <h2>Thank you for reaching out, ${escapeHtml(userName)}!</h2>
            <p>We have received your request and our team is looking into it.</p>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Title:</strong> ${escapeHtml(ticket.title)}</p>
            <p><strong>Status:</strong> Open</p>
        `
    });
    console.log(`Confirmation email sent to ${userEmail} for ticket ${ticket.ticketId}`);
};

const sendResolutionEmail = async (ticket, userEmail, userName) => {
    await resend.emails.send({
        from: 'Autocut Support <onboarding@resend.dev>',
        to: userEmail,
        subject: `Your issue has been resolved — Ticket #${ticket.ticketId}`,
        html: `
            <h2>Great news, ${escapeHtml(userName)}!</h2>
            <p>Your ticket has been resolved by our support team.</p>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Status:</strong> Resolved</p>
        `
    });
    console.log(`Resolution email sent to ${userEmail} for ticket ${ticket.ticketId}`);
};

module.exports = { sendTicketEmail, sendUserConfirmationEmail, sendResolutionEmail };