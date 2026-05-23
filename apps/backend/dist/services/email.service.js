import { env } from '../config/environment.js';
import { logger } from '../lib/logger.js';
import { welcomeStaffTemplate, welcomeCustomerTemplate, ticketCreatedTemplate, ticketCreatedHelpdeskTemplate, ticketAssignedCustomer2MinTemplate, ticketAssignedToAgentTemplate, ticketRcaTemplate, ticketUpdateByStaffTemplate, passwordResetOtpTemplate, ticketStatusUpdateTemplate, troubleshootingUpdateTemplate, longDelayUpdateTemplate, } from './email-templates.js';
const sendEmail = async ({ toEmail, toName, subject, htmlContent, ccEmail, }) => {
    const { serviceId, templateId, publicKey, privateKey } = env.emailjs;
    if (!serviceId || !templateId || !publicKey || !privateKey) {
        logger.warn('[EMAIL-SERVICE] Missing EmailJS credentials. Both Public and Private keys are required.');
        logger.debug(`Email would have been sent to ${toEmail}${ccEmail ? ` (CC: ${ccEmail})` : ''} with subject: ${subject}`);
        return;
    }
    try {
        logger.info(`[EMAIL-SERVICE] Attempting to send email to: ${toEmail}${ccEmail ? ` (CC: ${ccEmail})` : ''}`);
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: serviceId,
                template_id: templateId,
                user_id: publicKey,
                accessToken: privateKey,
                template_params: {
                    email: toEmail,
                    to_name: toName,
                    subject: subject,
                    html_content: htmlContent,
                    cc_email: ccEmail || '',
                },
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EmailJS Error: ${response.status} - ${errorText}`);
        }
        logger.info(`[EMAIL-SERVICE] Email sent successfully to ${toEmail}`);
    }
    catch (error) {
        logger.error('[EMAIL-SERVICE] Failed to send email:', error.message);
    }
};
export const sendStaffWelcomeEmail = async ({ name, email, password, role }) => {
    const { subject, html } = welcomeStaffTemplate({ name, email, password, role });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
export const sendCustomerWelcomeEmail = async ({ name, email, password }) => {
    const { subject, html } = welcomeCustomerTemplate({ name, email, password });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
export const sendTicketConfirmationEmail = async ({ name, email, ticketNo }) => {
    const { subject, html } = ticketCreatedTemplate({ ticketNo });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
export const sendTicketCreatedHelpdeskEmail = async ({ customerName, ticketNo, category, circuitId }) => {
    const { subject, html } = ticketCreatedHelpdeskTemplate({ customerName, ticketNo, category, circuitId });
    await sendEmail({
        toEmail: env.emailjs.helpdeskEmail,
        toName: 'Fab5 Helpdesk',
        subject,
        htmlContent: html,
    });
};
export const sendCustomerAssignment2MinEmail = async ({ name, email, ticketNo }) => {
    const { subject, html } = ticketAssignedCustomer2MinTemplate({ ticketNo });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
export const sendImmediateAgentAssignmentEmails = async ({ customerName, agentName, agentEmail, ticketNo, category, circuitId, }) => {
    const { subject, html } = ticketAssignedToAgentTemplate({
        ticketNo,
        customerName,
        agentName,
        category,
        circuitId,
    });
    await sendEmail({
        toEmail: agentEmail,
        toName: agentName,
        subject,
        htmlContent: html,
        ccEmail: env.emailjs.helpdeskEmail,
    });
};
export const sendTicketStatusUpdateEmail = async ({ name, email, ticketNo, status, updateType }) => {
    const { subject, html } = ticketStatusUpdateTemplate({ ticketNo, customerName: name, status, updateType });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
export const sendPasswordResetEmail = async ({ name, email, otpCode }) => {
    const { subject, html } = passwordResetOtpTemplate({ name, otpCode });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
export const sendTroubleshootingUpdateEmail = async ({ name, email, ticketNo }) => {
    const { subject, html } = troubleshootingUpdateTemplate({ ticketNo });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
export const sendLongDelayUpdateEmail = async ({ name, email, ticketNo }) => {
    const { subject, html } = longDelayUpdateTemplate({ ticketNo });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
export const sendTicketUpdateEmail = async ({ name, email, ticketNo, agentName, message }) => {
    const { subject, html } = ticketUpdateByStaffTemplate({ ticketNo, agentName, message });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
export const sendTicketRcaEmail = async ({ name, email, ticketNo, rca }) => {
    const { subject, html } = ticketRcaTemplate({ ticketNo, rca });
    await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};
//# sourceMappingURL=email.service.js.map