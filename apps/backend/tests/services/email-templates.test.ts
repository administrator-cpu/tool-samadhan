import { describe, it, expect } from 'vitest';
import {
  welcomeStaffTemplate,
  welcomeCustomerTemplate,
  ticketCreatedTemplate,
  ticketAssignedCustomer2MinTemplate,
  ticketTroubleshootingCustomer15MinTemplate,
  mediaOutage45MinTemplate,
  ticketUpdateByStaffTemplate,
  ticketStatusUpdateTemplate,
  ticketResolvedTemplate,
  ticketRcaTemplate,
  passwordResetOtpTemplate,
  guestOtpTemplate,
  serverErrorTemplate,
  mttrBreachEscalationTemplate,
} from '../../src/services/email-templates.js';

const PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=com.harshjha047.samadhan';

describe('Email Templates Branding & App Promo Banner', () => {
  it('applies the brand gradient and primary color to headers', () => {
    const { html } = welcomeCustomerTemplate({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'secretPassword123',
    });

    expect(html).toContain('background-color: #FF007A');
    expect(html).toContain('linear-gradient(135deg, #FF007A 0%, #FF5757 50%, #FFB900 100%)');
    expect(html).toContain('Plus Jakarta Sans');
    expect(html).not.toContain('#059669');
    expect(html).not.toContain('#f0fdf4');
  });

  it('renders context-specific welcome app banner in welcomeCustomerTemplate', () => {
    const { html } = welcomeCustomerTemplate({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'secretPassword123',
    });

    expect(html).toContain(PLAYSTORE_URL);
    expect(html).toContain('Get 24/7 support in your pocket');
    expect(html).toContain('Install on Android');
    expect(html).not.toContain('Track this ticket live');
  });

  it('renders live ticket tracking app banner in active ticket customer emails', () => {
    const templates = [
      ticketCreatedTemplate({ ticketNo: 'TT-101', circuitId: 'CKT-1', attachments: [] }),
      ticketAssignedCustomer2MinTemplate({ ticketNo: 'TT-101', circuitId: 'CKT-1' }),
      ticketTroubleshootingCustomer15MinTemplate({ ticketNo: 'TT-101', circuitId: 'CKT-1' }),
      mediaOutage45MinTemplate({ ticketNo: 'TT-101', circuitId: 'CKT-1' }),
      ticketUpdateByStaffTemplate({ ticketNo: 'TT-101', agentName: 'Alex', message: 'Checking router', attachments: [], circuitId: 'CKT-1' }),
      ticketStatusUpdateTemplate({ ticketNo: 'TT-101', status: 'IN_PROGRESS', updateType: 'REOPENED', circuitId: 'CKT-1' }),
    ];

    for (const { html } of templates) {
      expect(html).toContain(PLAYSTORE_URL);
      expect(html).toContain('Track this ticket live on the Samadhan Android App');
      expect(html).toContain('Install from Play Store');
    }
  });

  it('renders post-resolution convenience app banner in resolved and RCA templates', () => {
    const resolved = ticketResolvedTemplate({ ticketNo: 'TT-101', circuitId: 'CKT-1' });
    const rca = ticketRcaTemplate({
      ticketNo: 'TT-1001',
      rca: 'Fiber cut resolved at junction box',
      rcaImages: [],
      circuitId: 'CKT-999',
    });

    for (const { html } of [resolved, rca]) {
      expect(html).toContain(PLAYSTORE_URL);
      expect(html).toContain('Keep Samadhan on your phone to reopen tickets');
      expect(html).toContain('Get the App on Play Store');
    }

    expect(rca.html).toContain('border-left: 4px solid #FF007A');
    expect(rca.html).toContain('background-color: #FFF7F9');
  });

  it('renders OTP containers and OTP-tailored app banner in password reset and guest OTP templates', () => {
    const { html: pwdResetHtml } = passwordResetOtpTemplate({
      name: 'Jane',
      otpCode: '123456',
    });
    const { html: guestOtpHtml } = guestOtpTemplate({
      otpCode: '654321',
    });

    for (const html of [pwdResetHtml, guestOtpHtml]) {
      expect(html).toContain('background-color: #FFF7F9');
      expect(html).toContain('border: 2px dashed #FF007A');
      expect(html).toContain('color: #FF007A');
      expect(html).toContain(PLAYSTORE_URL);
      expect(html).toContain('Tired of OTPs? Log in once and manage everything on the Samadhan App.');
      expect(html).toContain('Download App');
      expect(html).not.toContain('#059669');
      expect(html).not.toContain('#065f46');
    }
  });

  it('excludes consumer app ads from internal staff and alert templates', () => {
    const staffWelcome = welcomeStaffTemplate({
      name: 'Agent Smith',
      email: 'smith@fab5.com',
      password: 'pass',
      role: 'SUPPORT_AGENT',
    });
    const serverError = serverErrorTemplate({
      timestamp: '2026-11-21T00:00:00Z',
      errorType: 'UnhandledRejection',
      errorMessage: 'Database timeout',
      stackTrace: 'Error: timeout\n at db.js:10',
      path: '/api/tickets',
      method: 'POST',
      payload: {},
      user: null,
    });
    const mttrBreach = mttrBreachEscalationTemplate({
      customerName: 'ACME',
      ticketNo: 'TT-500',
      category: 'Fiber Down',
      circuitId: 'CKT-5',
      agentName: 'Agent Smith',
    });

    for (const { html } of [staffWelcome, serverError, mttrBreach]) {
      expect(html).not.toContain(PLAYSTORE_URL);
    }

    expect(serverError.html).toContain('background-color: #FF007A');
    expect(serverError.html).toContain('color: #dc2626');
  });
});
