import dotenv from "dotenv";
import {
  welcomeStaffTemplate,
  welcomeCustomerTemplate,
  ticketCreatedTemplate,
  ticketCreatedHelpdeskTemplate,
  ticketAssignedCustomer5MinTemplate,
  ticketAssignedToAgentTemplate,
  ticketTroubleshootingCustomer15MinTemplate,
  ticketResolvedTemplate,
  ticketRcaTemplate,
  ticketUpdateByStaffTemplate,
  passwordResetOtpTemplate,
  ticketStatusUpdateTemplate,
  troubleshootingUpdateTemplate,
  longDelayUpdateTemplate
} from "./emailTemplates.js";

dotenv.config();

const sendEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.warn("[EMAIL-SERVICE] Missing EmailJS credentials. Both Public and Private keys are required for strict mode.");
    console.log(`[DEV-LOG] Email would have been sent to ${toEmail} with subject: ${subject}`);
    return;
  }

  try {
    console.log(`[EMAIL-SERVICE] Attempting to send email to: ${toEmail}`);
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS Error: ${response.status} - ${errorText}`);
    }

    console.log(`[EMAIL-SERVICE] Email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error("[EMAIL-SERVICE] Failed to send email:", error.message);
  }
};

/**
 * Sends a welcome email to a new staff member
 */
export const sendStaffWelcomeEmail = async ({ name, email, password, role }) => {
  const { subject, html } = welcomeStaffTemplate({ name, email, password, role });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends a welcome email to a new customer
 */
export const sendCustomerWelcomeEmail = async ({ name, email, password }) => {
  const { subject, html } = welcomeCustomerTemplate({ name, email, password });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends a ticket creation confirmation email
 */
export const sendTicketConfirmationEmail = async ({ name, email, ticketNo }) => {
  const { subject, html } = ticketCreatedTemplate({ ticketNo });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends a ticket creation helpdesk email
 */
export const sendTicketCreatedHelpdeskEmail = async ({ customerName, ticketNo, category, circuitId }) => {
  const { subject, html } = ticketCreatedHelpdeskTemplate({ customerName, ticketNo, category, circuitId });
  await sendEmail({
    toEmail: "helpdesk@fab5network.com",
    toName: "Fab5 Helpdesk",
    subject,
    htmlContent: html,
  });
};

/**
 * Sends a customer 5-minute assignment notification email
 */
export const sendCustomerAssignment5MinEmail = async ({ name, email, ticketNo }) => {
  const { subject, html } = ticketAssignedCustomer5MinTemplate({ ticketNo });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends immediate agent & helpdesk assignment emails
 */
export const sendImmediateAgentAssignmentEmails = async ({
  customerName,
  agentName,
  agentEmail,
  ticketNo,
  category,
  circuitId
}) => {
  const { subject, html } = ticketAssignedToAgentTemplate({
    ticketNo,
    customerName,
    category,
    circuitId
  });

  // 1. Notify Agent
  const p1 = sendEmail({
    toEmail: agentEmail,
    toName: agentName,
    subject,
    htmlContent: html,
  }).catch(err => console.error("[EMAIL] Immediate assignment (Agent) failed:", err));

  // 2. Notify Helpdesk
  const p2 = sendEmail({
    toEmail: "helpdesk@fab5network.com",
    toName: "Fab5 Helpdesk",
    subject,
    htmlContent: html,
  }).catch(err => console.error("[EMAIL] Immediate assignment (Helpdesk) failed:", err));

  await Promise.all([p1, p2]);
};

/**
 * Sends a ticket status update email
 */
export const sendTicketStatusUpdateEmail = async ({ name, email, ticketNo, status, updateType }) => {
  const { subject, html } = ticketStatusUpdateTemplate({ ticketNo, customerName: name, status, updateType });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends a password reset OTP email
 */
export const sendPasswordResetEmail = async ({ name, email, otpCode }) => {
  const { subject, html } = passwordResetOtpTemplate({ name, otpCode });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends troubleshooting update email
 */
export const sendTroubleshootingUpdateEmail = async ({ name, email, ticketNo }) => {
  const { subject, html } = troubleshootingUpdateTemplate({ ticketNo });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends long delay update email
 */
export const sendLongDelayUpdateEmail = async ({ name, email, ticketNo }) => {
  const { subject, html } = longDelayUpdateTemplate({ ticketNo });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends an email to the customer when a staff member updates the ticket
 */
export const sendTicketUpdateEmail = async ({ name, email, ticketNo, agentName, message }) => {
  const { subject, html } = ticketUpdateByStaffTemplate({ ticketNo, agentName, message });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends a ticket RCA update email
 */
export const sendTicketRcaEmail = async ({ name, email, ticketNo, rca }) => {
  const { subject, html } = ticketRcaTemplate({ ticketNo, rca });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};
