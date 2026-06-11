import { env } from '../config/environment.js';
import { logger } from '../lib/logger.js';
import {
  welcomeStaffTemplate,
  ticketAssignedToAgentTemplate,
  ticketCreatedHelpdeskTemplate,
  ticketReassignedToAgentTemplate,
  ticketReopenedAgentTemplate,

  welcomeCustomerTemplate,
  ticketCreatedTemplate,
  ticketAssignedCustomer2MinTemplate,
  ticketTroubleshootingCustomer15MinTemplate,
  mediaOutage45MinTemplate,
  ticketUpdateByStaffTemplate,
  ticketStatusUpdateTemplate,
  ticketRcaTemplate,
  
  passwordResetOtpTemplate,
} from './email-templates.js';

const sendEmail = async ({ toEmail, toName, subject, htmlContent, ccEmail }: { toEmail: string; toName: string; subject: string; htmlContent: string; ccEmail?: string; }) => {
  const { serviceId, templateId, publicKey, privateKey } = env.emailjs;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    logger.warn('[EMAIL-SERVICE] Missing EmailJS credentials.');
    logger.debug(`Email delivery skipped. Intended recipient: ${toEmail}${ccEmail ? ` (CC: ${ccEmail})` : ''}, subject: "${subject}".`);
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
          to_email: toEmail,
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
  } catch (error: any) {
    logger.error('[EMAIL-SERVICE] Failed to send email:', error.message);
  }
};

// --- Employee Email ---
export const sendStaffWelcomeEmail = async ({ name, email, password, role }: any) => {
  const { subject, html } = welcomeStaffTemplate({ name, email, password, role });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};

export const sendTicketCreatedHelpdeskEmail = async ({ customerName, ticketNo, category, circuitId }: any) => {
  const { subject, html } = ticketCreatedHelpdeskTemplate({ customerName, ticketNo, category, circuitId });
  await sendEmail({
    toEmail: env.emailjs.helpdeskEmail,
    toName: 'Fab5 Helpdesk',
    subject,
    htmlContent: html,
  });
};

export const sendImmediateAgentAssignmentEmails = async ({ customerName, agentName, agentEmail, ticketNo, category, circuitId }: any) => {
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

export const sendAgentReassignmentEmail = async ({ customerName, agentName, agentEmail, ticketNo, category, circuitId }: any) => {
  const { subject, html } = ticketReassignedToAgentTemplate({
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

export const sendTicketReopenedAgentEmail = async ({ customerName, agentName, agentEmail, ticketNo, category, circuitId }: any) => {
  const { subject, html } = ticketReopenedAgentTemplate({
    ticketNo,
    customerName,
    agentName,
    category,
    circuitId,
  });
  const toEmail = agentEmail || env.emailjs.helpdeskEmail;
  const ccEmail = agentEmail ? env.emailjs.helpdeskEmail : undefined;

  await sendEmail({
    toEmail,
    toName: agentName || 'Team',
    subject,
    htmlContent: html,
    ccEmail,
  });
};



// --- Customer Email ---
export const sendCustomerWelcomeEmail = async ({ name, email, password }: any) => {
  const { subject, html } = welcomeCustomerTemplate({ name, email, password });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};

export const sendTicketConfirmationEmail = async ({ name, email, ticketNo, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketCreatedTemplate({ ticketNo, circuitId });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
  if (alternateEmail) await sendEmail({ toEmail: alternateEmail, toName: name, subject, htmlContent: html });
};

export const sendCustomerAssignment2MinEmail = async ({ name, email, ticketNo, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketAssignedCustomer2MinTemplate({ ticketNo, circuitId });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
  if (alternateEmail) await sendEmail({ toEmail: alternateEmail, toName: name, subject, htmlContent: html });
};

export const sendTroubleshootingUpdateEmail = async ({ name, email, ticketNo, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketTroubleshootingCustomer15MinTemplate({ ticketNo, circuitId });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
  if (alternateEmail) await sendEmail({ toEmail: alternateEmail, toName: name, subject, htmlContent: html });
};

export const sendLongDelayUpdateEmail = async ({ name, email, ticketNo, alternateEmail, circuitId }: any) => {
  const { subject, html } = mediaOutage45MinTemplate({ ticketNo, circuitId });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
  if (alternateEmail) await sendEmail({ toEmail: alternateEmail, toName: name, subject, htmlContent: html });
};

export const sendTicketUpdateEmail = async ({ name, email, ticketNo, agentName, message, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketUpdateByStaffTemplate({ ticketNo, agentName, message, circuitId });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
  if (alternateEmail) await sendEmail({ toEmail: alternateEmail, toName: name, subject, htmlContent: html });
};

export const sendTicketStatusUpdateEmail = async ({ name, email, ticketNo, status, updateType, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketStatusUpdateTemplate({ ticketNo, customerName: name, status, updateType, circuitId });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
  if (alternateEmail) await sendEmail({ toEmail: alternateEmail, toName: name, subject, htmlContent: html });
};

export const sendTicketRcaEmail = async ({ name, email, ticketNo, rca, rcaImages, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketRcaTemplate({ ticketNo, rca, rcaImages, circuitId });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
  if (alternateEmail) await sendEmail({ toEmail: alternateEmail, toName: name, subject, htmlContent: html });
};



export const sendPasswordResetEmail = async ({ name, email, otpCode }: any) => {
  const { subject, html } = passwordResetOtpTemplate({ name, otpCode });
  await sendEmail({ toEmail: email, toName: name, subject, htmlContent: html });
};

