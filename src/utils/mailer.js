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

    const { data, error } = await resend.emails.send({
        from: 'Autocut Support <support@autocutsupport.online>',
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

    if (error) {
        console.error(`Email notification failed for ${recipientEmail}:`, error.message);
        return;
    }

    console.log(`Email sent to ${recipientEmail} for ticket ${ticket.ticketId}`);
};

const sendUserConfirmationEmail = async (ticket, userEmail, userName) => {
    const { data, error } = await resend.emails.send({
        from: 'Autocut Support <support@autocutsupport.online>',
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

    if (error) {
        console.error(`Confirmation email failed for ${userEmail}:`, error.message);
        return;
    }

    console.log(`Confirmation email sent to ${userEmail} for ticket ${ticket.ticketId}`);
};

const sendResolutionEmail = async (ticket, userEmail, userName) => {
    const { data, error } = await resend.emails.send({
        from: 'Autocut Support <support@autocutsupport.online>',
        to: userEmail,
        subject: `Your issue has been resolved — Ticket #${ticket.ticketId}`,
        html: `
            <h2>Great news, ${escapeHtml(userName)}!</h2>
            <p>Your ticket has been resolved by our support team.</p>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Status:</strong> Resolved</p>
        `
    });

    if (error) {
        console.error(`Resolution email failed for ${userEmail}:`, error.message);
        return;
    }

    console.log(`Resolution email sent to ${userEmail} for ticket ${ticket.ticketId}`);
};

let lastAlertSentAt = 0;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

const sendClassificationFailureAlert = async (errorMessage, sampleDescription = '') => {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL;
    if (!adminEmail) {
        console.warn('ADMIN_ALERT_EMAIL not set — skipping classification failure alert.');
        return;
    }

    const now = Date.now();
    if (now - lastAlertSentAt < ALERT_COOLDOWN_MS) {
        return;
    }
    lastAlertSentAt = now;

    const { data, error } = await resend.emails.send({
        from: 'Autocut Support <support@autocutsupport.online>',
        to: adminEmail,
        subject: `⚠️ Autocut: AI ticket classification is failing`,
        html: `
            <h2>AI classification failure detected</h2>
            <p>Tickets are currently falling back to <strong>General Inquiry</strong> because the classifier call is erroring out.</p>
            <p><strong>Error:</strong> ${escapeHtml(errorMessage)}</p>
            ${sampleDescription ? `<p><strong>Sample ticket description that failed:</strong><br/>${escapeHtml(sampleDescription)}</p>` : ''}
            <p>This is a common sign that the Groq model name has been deprecated/changed, the API key is invalid, or a rate limit was hit. Check Render logs and console.groq.com for details.</p>
            <p style="color:#888;font-size:12px">You won't get another alert for this for 30 minutes, even if it keeps failing, to avoid inbox spam.</p>
        `
    });

    if (error) {
        console.error(`Classification failure alert email failed:`, error.message);
        return;
    }

    console.log(`Classification failure alert sent to ${adminEmail}`);
};

module.exports = { sendTicketEmail, sendUserConfirmationEmail, sendResolutionEmail, sendClassificationFailureAlert };