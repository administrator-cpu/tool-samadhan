const emeraldLayout = (title, content) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #059669; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; text-transform: uppercase;">${title}</h1>
    </div>
    <div style="padding: 30px 24px; color: #1f2937; line-height: 1.6; font-size: 15px;">
      ${content}
    </div>
  </div>
`;

export const welcomeStaffTemplate = ({ name, email, password, role }) => ({
  subject: "Welcome to Fab5 Support Team",
  html: emeraldLayout(
    "Support Team Onboarding",
    `
      <h2 style="color: #059669; margin-top: 0; font-size: 18px;">Hello ${name},</h2>
      <p>Your account has been successfully created. You can now log in to the Support Dashboard using the credentials below:</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #4b5563; padding-bottom: 6px;">Email Address</td>
            <td style="color: #4b5563; padding-bottom: 6px;">Generated Password</td>
          </tr>
          <tr>
            <td style="color: #1f2937; font-weight: 700;">${email}</td>
            <td style="color: #1f2937; font-weight: 700; font-family: monospace;">${password}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 20px 0;">
        <span style="display: inline-block; background-color: #e6f4ea; color: #059669; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; text-transform: uppercase;">Role: ${role.replace('_', ' ')}</span>
      </div>

      <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">Please change your password after your first login for security purposes.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const welcomeCustomerTemplate = ({ name, email, password }) => ({
  subject: "Welcome to Fab5 Support Portal",
  html: emeraldLayout(
    "Account Created",
    `
      <p>Dear Customer,</p>
      <p>An account has been created for you on the Fab5 Support Portal. You can now log in to raise support tickets and track their status in real-time.</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #4b5563; padding-bottom: 6px;">Email Address</td>
            <td style="color: #4b5563; padding-bottom: 6px;">Temporary Password</td>
          </tr>
          <tr>
            <td style="color: #1f2937; font-weight: 700;">${email}</td>
            <td style="color: #1f2937; font-weight: 700; font-family: monospace;">${password}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #6b7280;">For security purposes, you will be required to change your password during your first login.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const ticketCreatedTemplate = ({ ticketNo }) => ({
  subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}`,
  html: emeraldLayout(
    "Complaint Registered",
    `
      <p>Dear Customer,</p>
      <p>This is to acknowledge that your complaint has been successfully registered in our system. Your Ticket ID is <strong>${ticketNo}</strong>. Please refer to this ID for any future communication regarding your concern.</p>
      
      <p style="margin-top: 20px; font-weight: bold;">You can also track your complaint online at <a href="https://www.fab5network.com/samadhan" style="color: #059669; text-decoration: underline;">www.fab5network.com/samadhan</a> for further updates.</p>
      
      <p>Thank you for your patience and cooperation.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const ticketCreatedHelpdeskTemplate = ({ customerName, ticketNo, category, circuitId }) => ({
  subject: `Fab5: Ticket ID – ${ticketNo} – Registered`,
  html: emeraldLayout(
    "New Ticket Registered",
    `
      <p>Dear Team,</p>
      <p>This is to inform that a complaint has been registered with below details:</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Name of Customer:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Ticket ID:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;"><strong>${ticketNo}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Issue Category:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;">${category}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Circuit Id:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;">${circuitId || 'N/A'}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const ticketAssignedCustomer5MinTemplate = ({ ticketNo }) => ({
  subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}`,
  html: emeraldLayout(
    "Complaint Under Process",
    `
      <p>Dear Customer,</p>
      <p>We would like to inform you that your complaint has been assigned to the concerned department for further investigation and necessary action.</p>
      
      <p style="margin-top: 20px; font-weight: bold;">You can also track your complaint online at <a href="https://www.fab5network.com/samadhan" style="color: #059669; text-decoration: underline;">www.fab5network.com/samadhan</a> for further updates.</p>
      
      <p>Thank you for your patience and cooperation.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const ticketAssignedToAgentTemplate = ({ ticketNo, customerName, category, circuitId }) => ({
  subject: `Fab5: Ticket ID – ${ticketNo} – Assigned`,
  html: emeraldLayout(
    "Ticket Assigned",
    `
      <p>Dear Team,</p>
      <p>This is to inform that a complaint has been assigned to you with below details:</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Name of Customer:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Ticket ID:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;"><strong>${ticketNo}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Issue Category:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;">${category}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Circuit Id:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;">${circuitId || 'N/A'}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const ticketTroubleshootingCustomer15MinTemplate = ({ ticketNo }) => ({
  subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}`,
  html: emeraldLayout(
    "Troubleshooting in Progress",
    `
      <p>Dear Customer,</p>
      <p>To expedite and prioritize the restoration of your services, we are performing detailed troubleshooting. The estimated resolution time is 45 minutes.</p>
      
      <p style="margin-top: 20px; font-weight: bold;">You can also track your complaint online at <a href="https://www.fab5network.com/samadhan" style="color: #059669; text-decoration: underline;">www.fab5network.com/samadhan</a> for further updates.</p>
      
      <p>Thank you for your patience and cooperation.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const ticketResolvedTemplate = ({ ticketNo }) => ({
  subject: `Fab5: Ticket ID – ${ticketNo} – Resolved`,
  html: emeraldLayout(
    "Complaint Resolved",
    `
      <p>Dear Customer,</p>
      <p>We are pleased to inform you that your complaint has been successfully resolved. With this, we are proceeding to close your complaint in our system. If you believe the issue has not been fully resolved or require any further assistance, then please reopen the ticket with 24 hrs.</p>
      <p>We would appreciate it if you could take a moment to share your feedback on portal of your experience with our support team. Your input is valuable and helps us improve our services.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong></p>
      </div>
    `
  )
});

export const ticketRcaTemplate = ({ ticketNo, rca }) => ({
  subject: `Fab5: Root Cause Analysis - Ticket ID ${ticketNo}`,
  html: emeraldLayout(
    "Root Cause Analysis Update",
    `
      <p>Dear Customer,</p>
      <p>Update on Root Cause Analysis of Reported Issue: <strong>${ticketNo}</strong> (Ticket ID)</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; font-style: italic;">
        "${rca}"
      </div>
      
      <p>Please feel free to reach out if you have any questions or need additional clarification.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong></p>
      </div>
    `
  )
});

export const ticketUpdateByStaffTemplate = ({ ticketNo, agentName, message }) => ({
  subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}`,
  html: emeraldLayout(
    "New Message Received",
    `
      <p>Dear Customer,</p>
      <p>Our support specialist, <strong>${agentName}</strong>, has provided an update on your ticket:</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; font-style: italic;">
        "${message}"
      </div>
      
      <p style="margin-top: 20px; font-weight: bold;">You can also track your complaint online at <a href="https://www.fab5network.com/samadhan" style="color: #059669; text-decoration: underline;">www.fab5network.com/samadhan</a> for further updates.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const passwordResetOtpTemplate = ({ name, otpCode }) => ({
  subject: "Fab5 - Password Reset Verification",
  html: emeraldLayout(
    "Password Recovery",
    `
      <p>Dear Customer,</p>
      <p>We received a request to reset your support account password. Use the verification code below to proceed. <strong style="color: #dc2626;">This code will expire in 5 minutes.</strong></p>
      
      <div style="background-color: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
        <div style="color: #065f46; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Verification Code</div>
        <div style="color: #059669; font-size: 36px; font-weight: 900; letter-spacing: 0.2em; font-family: monospace;">${otpCode}</div>
      </div>
      
      <p style="font-size: 13px; color: #6b7280;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const ticketStatusUpdateTemplate = ({ ticketNo, status, updateType }) => {
  if (updateType === "CLOSED" || status === "RESOLVED" || status === "CLOSED") {
    return ticketResolvedTemplate({ ticketNo });
  }

  const config = {
    REOPENED: {
      title: "Complaint Reopened",
      subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}`,
      message: `Your ticket has been reopened. Our support team has been notified and will prioritize your request for further assistance.`,
      footer: "Customer Support Team"
    },
    ESCALATED: {
      title: "Complaint Escalated",
      subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}`,
      message: `Your ticket has been escalated to our senior support management. We are dedicating extra resources to ensure a swift resolution.`,
      footer: "Customer Support Team"
    }
  }[updateType] || {
    title: "Complaint Updated",
    subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}`,
    message: `Your ticket status has been updated to ${status.replace('_', ' ')}.`,
    footer: "Customer Support Team"
  };

  const footerLine = config.footer 
    ? `Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>${config.footer}`
    : `Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong>`;

  return {
    subject: config.subject,
    html: emeraldLayout(
      config.title,
      `
        <p>Dear Customer,</p>
        <p>${config.message}</p>
        
        <p style="margin-top: 20px; font-weight: bold;">You can also track your complaint online at <a href="https://www.fab5network.com/samadhan" style="color: #059669; text-decoration: underline;">www.fab5network.com/samadhan</a> for further updates.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 14px;">${footerLine}</p>
        </div>
      `
    )
  };
};

export const troubleshootingUpdateTemplate = ({ ticketNo }) => ({
  subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}`,
  html: emeraldLayout(
    "Troubleshooting in Progress",
    `
      <p>Dear Customer,</p>
      <p>To expedite and prioritize the restoration of your services, we are performing detailed troubleshooting. The estimated resolution time is 45 minutes.</p>
      
      <p style="margin-top: 20px; font-weight: bold;">You can also track your complaint online at <a href="https://www.fab5network.com/samadhan" style="color: #059669; text-decoration: underline;">www.fab5network.com/samadhan</a> for further updates.</p>
      
      <p>Thank you for your patience and cooperation.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});

export const longDelayUpdateTemplate = ({ ticketNo }) => ({
  subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}`,
  html: emeraldLayout(
    "Investigation Timeline Update",
    `
      <p>Dear Customer,</p>
      <p>Your ticket is undergoing an in-depth investigation by our senior support specialists. We estimate it will take approximately 4 hours to fully resolve this issue.</p>
      
      <p style="margin-top: 20px; font-weight: bold;">You can also track your complaint online at <a href="https://www.fab5network.com/samadhan" style="color: #059669; text-decoration: underline;">www.fab5network.com/samadhan</a> for further updates.</p>
      
      <p>Thank you for your patience and cooperation.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/>Customer Support Team</p>
      </div>
    `
  )
});
