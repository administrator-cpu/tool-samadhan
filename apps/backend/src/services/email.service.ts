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
  
  serverErrorTemplate,
  mttrBreachEscalationTemplate,
} from './email-templates.js';

const sendEmail = async ({ toEmail, subject, htmlContent, ccEmail }: { toEmail: string; subject: string; htmlContent: string; ccEmail?: string; }): Promise<boolean> => {
  
  const resendServiceDomain = env.resendServiceDomain;
  const resendServiceApiKey = env.resendServiceApiKey;
  if (!resendServiceApiKey || !resendServiceDomain) {
    logger.warn('[EMAIL-SERVICE] Missing Resend Service credentials.');
    logger.debug(`Email delivery skipped. Intended recipient: ${toEmail}${ccEmail ? ` (CC: ${ccEmail})` : ''}, subject: "${subject}".`);
    return false;
  }

  try {
    logger.info(`[EMAIL-SERVICE] Attempting to send email to: ${toEmail}${ccEmail ? ` (CC: ${ccEmail})` : ''}`);
    const response = await fetch(`${resendServiceDomain}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${resendServiceApiKey}`,
      },
      body: JSON.stringify({
        to: toEmail,
        cc: ccEmail || undefined,
        subject,
        html: htmlContent,
        fromName:"FAB5 Connect"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email Service Error: ${response.status} - ${errorText}`);
    }

    logger.info(`[EMAIL-SERVICE] Email sent successfully to ${toEmail}`);
    return true;
  } catch (error: any) {
    logger.error('[EMAIL-SERVICE] Failed to send email:', error.message);
    return false;
  }
};

// --- Employee Email ---
export const sendStaffWelcomeEmail = async ({ name, email, password, role }: any) => {
  const { subject, html } = welcomeStaffTemplate({ name, email, password, role });
  await sendEmail({ toEmail: email, subject, htmlContent: html });
};

export const sendTicketCreatedHelpdeskEmail = async ({ customerName, ticketNo, category, circuitId, attachments }: any) => {
  const { subject, html } = ticketCreatedHelpdeskTemplate({ customerName, ticketNo, category, circuitId, attachments });
  await sendEmail({
    toEmail: env.helpdeskEmail,
    subject,
    htmlContent: html,
  });
};

export const sendImmediateAgentAssignmentEmails = async ({ customerName, agentName, agentEmail, ticketNo, category, circuitId }: any) => {
  const { subject, html } = ticketAssignedToAgentTemplate({ ticketNo, customerName, agentName, category, circuitId });
  const ccEmail = agentEmail !== env.helpdeskEmail ? env.helpdeskEmail : undefined;
  await sendEmail({
    toEmail: agentEmail,
    subject,
    htmlContent: html,
    ccEmail,
  });
};

export const sendAgentReassignmentEmail = async ({ customerName, agentName, agentEmail, ticketNo, category, circuitId }: any) => {
  const { subject, html } = ticketReassignedToAgentTemplate({ ticketNo, customerName, agentName, category, circuitId });
  const ccEmail = agentEmail !== env.helpdeskEmail ? env.helpdeskEmail : undefined;
  await sendEmail({
    toEmail: agentEmail,
    subject,
    htmlContent: html,
    ccEmail,
  });
};
  
export const sendTicketReopenedAgentEmail = async ({ customerName, agentName, agentEmail, ticketNo, category, circuitId }: any) => {
  const { subject, html } = ticketReopenedAgentTemplate({ ticketNo, customerName, agentName, category, circuitId });
  const toEmail = agentEmail || env.helpdeskEmail;
  const ccEmail = agentEmail && agentEmail !== env.helpdeskEmail ? env.helpdeskEmail : undefined;

  await sendEmail({
    toEmail,
    subject,
    htmlContent: html,
    ccEmail,
  });
};

export const sendMttrEscalationEmail = async ({ customerName, ticketNo, category, circuitId, agentName }: any): Promise<boolean> => {
  const { subject, html } = mttrBreachEscalationTemplate({ customerName, ticketNo, category, circuitId, agentName });

  const catLower = (category || '').toLowerCase();
  
  let toEmail = env.ceoEmail;
  if ( catLower.includes('link down') || catLower.includes('latency very high') || catLower.includes('packet drops') || catLower.includes('link fluctuating') ) {
    toEmail = env.arunavEmail || env.ceoEmail;
  }

  return await sendEmail({
    toEmail,
    subject,
    htmlContent: html,
    ccEmail: env.helpdeskEmail,
  });
};



// --- Customer Email ---
export const sendCustomerWelcomeEmail = async ({ name, email, password }: any) => {
  const { subject, html } = welcomeCustomerTemplate({ name, email, password });
  await sendEmail({ toEmail: email, subject, htmlContent: html });
};

export const sendTicketConfirmationEmail = async ({ name, email, ticketNo, alternateEmail, circuitId, attachments }: any) => {
  const { subject, html } = ticketCreatedTemplate({ ticketNo, circuitId, attachments });
  await sendEmail({ toEmail: email, subject, htmlContent: html });
  // if (alternateEmail) await sendEmail({ toEmail: alternateEmail, subject, htmlContent: html });
  
  // Alternate emails
  const alternateEmails = alternateEmail ? alternateEmail.split(",").map((email) => email.trim()).filter(Boolean) : [];
  if (alternateEmails?.length) {
    for (const email of alternateEmails) {
      await sendEmail({ toEmail: email, subject, htmlContent: html });
    }
  }
};

export const sendCustomerAssignment2MinEmail = async ({ name, email, ticketNo, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketAssignedCustomer2MinTemplate({ ticketNo, circuitId });
  await sendEmail({ toEmail: email, subject, htmlContent: html });
  // if (alternateEmail) await sendEmail({ toEmail: alternateEmail, subject, htmlContent: html });
  
  // Alternate emails
  const alternateEmails = alternateEmail ? alternateEmail.split(",").map((email) => email.trim()).filter(Boolean) : [];
  if (alternateEmails?.length) {
    for (const email of alternateEmails) {
      await sendEmail({ toEmail: email, subject, htmlContent: html });
    }
  }
};

export const sendTroubleshootingUpdateEmail = async ({ name, email, ticketNo, alternateEmail, circuitId }: any): Promise<boolean> => {
  const { subject, html } = ticketTroubleshootingCustomer15MinTemplate({ ticketNo, circuitId });
  const success = await sendEmail({ toEmail: email, subject, htmlContent: html });
  // if (alternateEmail) await sendEmail({ toEmail: alternateEmail, subject, htmlContent: html });
  

  // Alternate emails
  const alternateEmails = alternateEmail ? alternateEmail.split(",").map((email) => email.trim()).filter(Boolean) : [];
  if (alternateEmails?.length) {
    for (const email of alternateEmails) {
      await sendEmail({ toEmail: email, subject, htmlContent: html });
    }
  }
  return success;
};

export const sendLongDelayUpdateEmail = async ({ name, email, ticketNo, alternateEmail, circuitId }: any): Promise<boolean> => {
  const { subject, html } = mediaOutage45MinTemplate({ ticketNo, circuitId });
  const success = await sendEmail({ toEmail: email, subject, htmlContent: html });
  // if (alternateEmail) await sendEmail({ toEmail: alternateEmail, subject, htmlContent: html });
  

  // Alternate emails
  const alternateEmails = alternateEmail ? alternateEmail.split(",").map((email) => email.trim()).filter(Boolean) : [];
  if (alternateEmails?.length) {
    for (const email of alternateEmails) {
      await sendEmail({ toEmail: email, subject, htmlContent: html });
    }
  }
  return success;
};

export const sendTicketUpdateEmail = async ({ name, email, ticketNo, agentName, message, attachments, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketUpdateByStaffTemplate({ ticketNo, agentName, message, attachments, circuitId });
  await sendEmail({ toEmail: email, subject, htmlContent: html });
  // if (alternateEmail) await sendEmail({ toEmail: alternateEmail, subject, htmlContent: html });
  

  // Alternate emails
  const alternateEmails = alternateEmail ? alternateEmail.split(",").map((email) => email.trim()).filter(Boolean) : [];
  if (alternateEmails?.length) {
    for (const email of alternateEmails) {
      await sendEmail({ toEmail: email, subject, htmlContent: html });
    }
  }
};

export const sendTicketStatusUpdateEmail = async ({ name, email, ticketNo, status, updateType, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketStatusUpdateTemplate({ ticketNo, customerName: name, status, updateType, circuitId });
  await sendEmail({ toEmail: email, subject, htmlContent: html });
  // if (alternateEmail) await sendEmail({ toEmail: alternateEmail, subject, htmlContent: html });
  

  // Alternate emails
  const alternateEmails = alternateEmail ? alternateEmail.split(",").map((email) => email.trim()).filter(Boolean) : [];
  if (alternateEmails?.length) {
    for (const email of alternateEmails) {
      await sendEmail({ toEmail: email, subject, htmlContent: html });
    }
  }
};

export const sendTicketRcaEmail = async ({ name, email, ticketNo, rca, rcaImages, alternateEmail, circuitId }: any) => {
  const { subject, html } = ticketRcaTemplate({ ticketNo, rca, rcaImages, circuitId });
  await sendEmail({ toEmail: email, subject, htmlContent: html });
  // if (alternateEmail) await sendEmail({ toEmail: alternateEmail, subject, htmlContent: html });
  

  // Alternate emails
  const alternateEmails = alternateEmail ? alternateEmail.split(",").map((email) => email.trim()).filter(Boolean) : [];
  if (alternateEmails?.length) {
    for (const email of alternateEmails) {
      await sendEmail({ toEmail: email, subject, htmlContent: html });
    }
  }
};



export const sendPasswordResetEmail = async ({ name, email, otpCode }: any) => {
  const { subject, html } = passwordResetOtpTemplate({ name, otpCode });
  await sendEmail({ toEmail: email, subject, htmlContent: html });
};

// --- System Alert Email ---
// In-memory throttling map to prevent email spam for the same error.
// Key: error hash/message, Value: timestamp of last sent email
const errorThrottleMap = new Map<string, number>();
const THROTTLE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export const sendServerErrorEmail = async (errorDetails: { timestamp: string; errorType: string; errorMessage: string; stackTrace?: string; path?: string; method?: string; payload?: any; }) => {
  const adminEmail = 'ajaynegi3345@gmail.com';
  
  // Throttle by error message and path
  const throttleKey = `${errorDetails.errorMessage}-${errorDetails.path || 'no-path'}`;
  const now = Date.now();
  const lastSent = errorThrottleMap.get(throttleKey);

  if (lastSent && now - lastSent < THROTTLE_DURATION_MS) {
    logger.debug(`[EMAIL-SERVICE] Throttled server error email for: ${throttleKey}`);
    return;
  }

  // Update throttle map
  errorThrottleMap.set(throttleKey, now);

  const { subject, html } = serverErrorTemplate(errorDetails);
  await sendEmail({ 
    toEmail: adminEmail, 
    subject, 
    htmlContent: html 
  });
};

