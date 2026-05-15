export const welcomeStaffTemplate = ({ name, email, password, role }) => ({
  subject: "Welcome to Samadhan Support Team",
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #065f46; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.025em;">Welcome to Samadhan</h1>
        <p style="color: #a7f3d0; margin-top: 8px; font-size: 16px;">Support Team Onboarding</p>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${name},</h2>
        <p style="color: #475569; line-height: 1.6; font-size: 16px;">Your account has been successfully created. You can now log in to the Samadhan Support Dashboard using the credentials below:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 30px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Email Address</td>
              <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Generated Password</td>
            </tr>
            <tr>
              <td style="color: #1e293b; font-weight: 600; font-size: 16px;">${email}</td>
              <td style="color: #1e293b; font-weight: 600; font-size: 16px; font-family: monospace;">${password}</td>
            </tr>
          </table>
        </div>

        <div style="margin: 35px 0;">
          <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 12px;">Assigned Role</h3>
          <span style="display: inline-block; background-color: #f1f5f9; color: #475569; padding: 6px 12px; rounded: 6px; font-size: 14px; font-weight: 700; text-transform: uppercase;">${role.replace('_', ' ')}</span>
        </div>

        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">Please change your password after your first login for security purposes.</p>
        
        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Samadhan Support System &bull; Enterprise Operations</p>
        </div>
      </div>
    </div>
  `
});

export const ticketCreatedTemplate = ({ ticketNo, customerName, category, priority }) => ({
  subject: `Samadhan - Ticket Created: #${ticketNo}`,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #059669; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Ticket Confirmed</h1>
        <p style="color: #d1fae5; margin-top: 8px; font-size: 16px; font-weight: 500;">Request ID: #${ticketNo}</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${customerName},</h2>
        <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 30px;">
          Your support ticket has been successfully created. Our team has been notified and we are currently reviewing your request.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; padding-bottom: 10px;">Category</td>
              <td style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; padding-bottom: 10px;">Priority</td>
            </tr>
            <tr>
              <td style="color: #1e293b; font-weight: 700; font-size: 16px;">${category}</td>
              <td style="color: #1e293b; font-weight: 700; font-size: 16px;">
                <span style="color: ${priority === 'URGENT' ? '#dc2626' : priority === 'HIGH' ? '#d97706' : '#059669'}">${priority}</span>
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 30px;">
          You can track the progress of your ticket anytime by logging into your Samadhan dashboard.
        </p>
        
        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500;">
            Samadhan Support System &bull; Intelligent Resolution Engine
          </p>
        </div>
      </div>
    </div>
  `
});

export const ticketStatusUpdateTemplate = ({ ticketNo, customerName, status, updateType }) => {
  const config = {
    CLOSED: {
      title: "Ticket Resolved",
      subtitle: "Issue has been closed",
      color: "#059669",
      message: "We're happy to inform you that your ticket has been marked as resolved and closed. If you still face any issues, you can reopen the ticket from your dashboard."
    },
    REOPENED: {
      title: "Ticket Reopened",
      subtitle: "We're back on it",
      color: "#0891b2",
      message: "Your ticket has been reopened. Our support team has been notified and will prioritize your request for further assistance."
    },
    ESCALATED: {
      title: "Ticket Escalated",
      subtitle: "High Priority Review",
      color: "#dc2626",
      message: "Your ticket has been escalated to our senior support management. We are dedicating extra resources to ensure a swift resolution."
    }
  }[updateType] || {
    title: "Ticket Updated",
    subtitle: `Status changed to ${status}`,
    color: "#4f46e5",
    message: `Your ticket status has been updated to ${status}.`
  };

  return {
    subject: `Samadhan - Ticket Update: #${ticketNo} [${config.title}]`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: ${config.color}; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.040em;">${config.title}</h1>
          <p style="color: #ffffff; opacity: 0.8; margin-top: 8px; font-size: 16px; font-weight: 500;">Ticket #${ticketNo}</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${customerName},</h2>
          <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
            ${config.message}
          </p>
          
          <div style="display: inline-block; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px;">
            <span style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; margin-right: 10px;">New Status:</span>
            <span style="color: ${config.color}; font-weight: 800; font-size: 14px; text-transform: uppercase;">${status.replace('_', ' ')}</span>
          </div>

          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500;">
              Samadhan Enterprise Operations &bull; Priority Support
            </p>
          </div>
        </div>
      </div>
    `
  };
};
export const passwordResetOtpTemplate = ({ name, otpCode }) => ({
  subject: "Samadhan - Password Reset OTP",
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
      <div style="background-color: #059669; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Samadhan Security</h1>
        <p style="color: #d1fae5; margin-top: 8px; font-size: 16px; font-weight: 500;">Password Recovery Verification</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${name},</h2>
        <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 30px;">
          We received a request to reset your Samadhan account password. Use the verification code below to proceed. 
          <span style="color: #059669; font-weight: 600;">This code will expire in 5 minutes.</span>
        </p>
        
        <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
          <div style="color: #065f46; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">Verification Code</div>
          <div style="color: #047857; font-size: 42px; font-weight: 900; letter-spacing: 0.2em; font-family: 'Courier New', Courier, monospace;">${otpCode}</div>
        </div>

        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 30px;">
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        
        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500;">
            &copy; ${new Date().getFullYear()} Samadhan Enterprise Operations. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `
});

export const ticketAssignedToCustomerTemplate = ({ ticketNo, customerName, agentName, category, priority }) => ({
  subject: `Samadhan - Ticket Assigned: #${ticketNo}`,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #4f46e5; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Agent Assigned</h1>
        <p style="color: #e0e7ff; margin-top: 8px; font-size: 16px; font-weight: 500;">Ticket #${ticketNo}</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${customerName},</h2>
        <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
          Your ticket has been assigned to our support specialist, <strong style="color: #4f46e5;">${agentName}</strong>. They will review your request and provide a resolution shortly.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Ticket Summary</div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding-bottom: 8px; color: #64748b; font-size: 14px;">Category</td>
              <td style="padding-bottom: 8px; color: #1e293b; font-weight: 700; font-size: 14px; text-align: right;">${category}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; color: #64748b; font-size: 14px;">Priority</td>
              <td style="padding-bottom: 8px; color: ${priority === 'URGENT' ? '#dc2626' : '#10b981'}; font-weight: 700; font-size: 14px; text-align: right;">${priority}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500;">
            Samadhan Enterprise Support &bull; Personal Assistance
          </p>
        </div>
      </div>
    </div>
  `
});

export const ticketAssignedToAgentTemplate = ({ ticketNo, agentName, customerName, customerId, category, message, priority }) => ({
  subject: `Samadhan - New Ticket Assigned: #${ticketNo}`,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #1e293b; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">New Assignment</h1>
        <p style="color: #94a3b8; margin-top: 8px; font-size: 16px; font-weight: 500;">Ticket #${ticketNo}</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${agentName},</h2>
        <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 30px;">
          A new ticket has been assigned to you. Please review the details below and initiate the resolution process.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px;">Customer & Ticket Info</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Customer Name</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 700; text-align: right;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Customer ID</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 700; text-align: right;">${customerId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Category</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 700; text-align: right;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Priority</td>
              <td style="padding: 8px 0; color: ${priority === 'URGENT' ? '#dc2626' : '#10b981'}; font-weight: 700; text-align: right;">${priority}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Customer Message</div>
            <div style="color: #475569; font-style: italic; line-height: 1.5; font-size: 13px;">"${message}"</div>
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500;">
            Samadhan Internal Support Queue &bull; Enterprise Operations
          </p>
        </div>
      </div>
    </div>
  `
});

export const troubleshootingUpdateTemplate = ({ ticketNo, customerName }) => ({
  subject: `Samadhan Update - Ticket #${ticketNo}: Investigation Underway`,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #065f46; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Technical Review</h1>
        <p style="color: #a7f3d0; margin-top: 8px; font-size: 16px; font-weight: 500;">Ticket #${ticketNo} Update</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${customerName},</h2>
        <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
          Our technical team is currently investigating your request. We are performing a root-cause analysis to ensure a permanent resolution.
        </p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0;">
            Estimated Update Window: <span style="font-weight: 800;">~45 Minutes</span>
          </p>
        </div>

        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
          You will receive another update as soon as the assigned specialist completes their review.
        </p>
        
        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500;">
            Samadhan Support System &bull; Intelligent Resolution Engine
          </p>
        </div>
      </div>
    </div>
  `
});

export const longDelayUpdateTemplate = ({ ticketNo, customerName }) => ({
  subject: `Samadhan Update - Ticket #${ticketNo}: Resolution Timeline`,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #059669; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Priority Resolution</h1>
        <p style="color: #d1fae5; margin-top: 8px; font-size: 16px; font-weight: 500;">Extended Timeline Update</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${customerName},</h2>
        <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
          Your ticket is undergoing an in-depth investigation by our senior support specialists. Due to the technical nature of the request, resolution may take longer than initially estimated.
        </p>
        
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0;">
            Current Resolution Estimate: <span style="font-weight: 800;">Up to 4 Hours</span>
          </p>
        </div>

        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
          We appreciate your patience while we work towards a definitive solution. We will notify you immediately once the resolution is applied.
        </p>
        
        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500;">
            Samadhan Enterprise Support &bull; Tier 2 Technical Queue
          </p>
        </div>
      </div>
    </div>
  `
});
