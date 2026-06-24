import { env } from '../config/environment.js';
import { logger } from '../lib/logger.js';
import {
  ticketCreatedSmsTemplate,
  troubleshootingUpdateSmsTemplate,
  mediaOutageSmsTemplate,
  staffUpdateSmsTemplate,
  ticketReopenedSmsTemplate,
  ticketResolvedSmsTemplate,
  rootCauseAnalysisSmsTemplate,
} from './sms-templates.js';

export const sendSms = async (mobileno: string, text: string): Promise<boolean> => {
  const { baseUrl, apiKey, route, sender } = env.sms;

  if (!baseUrl || !apiKey || !sender) {
    logger.warn('[SMS-SERVICE] Missing SMS configuration credentials.');
    logger.debug(`SMS delivery skipped. Intended recipient: ${mobileno}, message: "${text}".`);
    return false;
  }

  try {
    logger.info(`[SMS-SERVICE] Attempting to send SMS to: ${mobileno}`);
    
    // Construct the URL with query parameters
    const url = new URL(baseUrl);
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('route', route);
    url.searchParams.append('sender', sender);
    url.searchParams.append('mobileno', mobileno);
    url.searchParams.append('text', text);

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RapidSMS Error: ${response.status} - ${errorText}`);
    }

    logger.info(`[SMS-SERVICE] SMS sent successfully to ${mobileno}`);
    return true;
  } catch (error: any) {
    logger.error('[SMS-SERVICE] Failed to send SMS:', error.message);
    return false;
  }
};

// --- Specific SMS Send Functions ---

export const sendTicketCreatedSms = async (phone: string, ticketNo: string) => {
  const text = ticketCreatedSmsTemplate(ticketNo);
  await sendSms(phone, text);
};

export const sendTroubleshootingUpdateSms = async (phone: string, ticketNo: string) => {
  const text = troubleshootingUpdateSmsTemplate(ticketNo);
  await sendSms(phone, text);
};

export const sendMediaOutageAlertSms = async (phone: string, message: string) => {
  const text = mediaOutageSmsTemplate(message);
  await sendSms(phone, text);
};

export const sendStaffUpdateSms = async (phone: string, message: string) => {
  const text = staffUpdateSmsTemplate(message);
  await sendSms(phone, text);
};

export const sendTicketReopenedSms = async (phone: string, ticketNo: string) => {
  const text = ticketReopenedSmsTemplate(ticketNo);
  await sendSms(phone, text);
};

export const sendTicketResolvedSms = async (phone: string, ticketNo: string) => {
  const text = ticketResolvedSmsTemplate(ticketNo);
  await sendSms(phone, text);
};

export const sendRootCauseAnalysisSms = async (phone: string, ticketNo: string) => {
  const text = rootCauseAnalysisSmsTemplate(ticketNo);
  await sendSms(phone, text);
};
