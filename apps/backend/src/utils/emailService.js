import dotenv from "dotenv";
import { welcomeStaffTemplate } from "./emailTemplates.js";
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
          email: toEmail,
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
    // I don't throw error here to avoid breaking the account creation flow, 
    // but I log it for the admin and later on the Loki.
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
 * Sends a ticket creation confirmation email
 */
export const sendTicketConfirmationEmail = async ({ name, email, ticketNo, category, priority }) => {
  const { ticketCreatedTemplate } = await import("./emailTemplates.js");
  const { subject, html } = ticketCreatedTemplate({ ticketNo, customerName: name, category, priority });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends a ticket status update email
 */
export const sendTicketStatusUpdateEmail = async ({ name, email, ticketNo, status, updateType }) => {
  const { ticketStatusUpdateTemplate } = await import("./emailTemplates.js");
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
  const { passwordResetOtpTemplate } = await import("./emailTemplates.js");
  const { subject, html } = passwordResetOtpTemplate({ name, otpCode });
  await sendEmail({
    toEmail: email,
    toName: name,
    subject,
    htmlContent: html,
  });
};

/**
 * Sends ticket assignment emails to both customer and agent
 */
export const sendTicketAssignmentEmails = async ({ 
  customerName, customerEmail, customerId, 
  agentName, agentEmail, 
  ticketNo, category, priority, message 
}) => {
  const { ticketAssignedToCustomerTemplate, ticketAssignedToAgentTemplate } = await import("./emailTemplates.js");

  // 1. Notify Customer
  const customerEmailObj = ticketAssignedToCustomerTemplate({ 
    ticketNo, customerName, agentName, category, priority 
  });
  
  const p1 = sendEmail({
    toEmail: customerEmail,
    toName: customerName,
    subject: customerEmailObj.subject,
    htmlContent: customerEmailObj.html,
  }).catch(err => console.error("[EMAIL] Assignment (Customer) failed:", err));

  // 2. Notify Agent
  const agentEmailObj = ticketAssignedToAgentTemplate({ 
    ticketNo, agentName, customerName, customerId, category, message, priority 
  });
  
  const p2 = sendEmail({
    toEmail: agentEmail,
    toName: agentName,
    subject: agentEmailObj.subject,
    htmlContent: agentEmailObj.html,
  }).catch(err => console.error("[EMAIL] Assignment (Agent) failed:", err));

  await Promise.all([p1, p2]);
};
