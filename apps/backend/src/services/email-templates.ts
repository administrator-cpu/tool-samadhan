const emeraldLayout = (title, content) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #059669; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; text-transform: uppercase;">${title}</h1>
    </div>
    <div style="padding: 30px 16px; color: #1f2937; line-height: 1.6; font-size: 15px;">
      ${content}
    </div>
  </div>
`;



// ---Employee Templates---

export const welcomeStaffTemplate = ( { name, email, password, role }: any) => ( {
  subject: "Welcome to Fab5 Support Team",
  html: emeraldLayout(
    "Support Team Onboarding",
    `
      <h2 style="color: #059669; margin-top: 0; font-size: 18px;">Hello ${name},</h2>
      <p>Your account has been successfully created. You can now log in to the Support Dashboard using the credentials below:</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #4b5563; padding-bottom: 6px;">Email Address: </td>
            <td style="color: #1f2937; font-weight: 600; word-break: break-word; overflow-wrap: break-word; ">${email}</td>
          </tr>
          <tr>
            <td style="color: #4b5563; padding-bottom: 6px;">Generated Password: </td>
            <td style="color: #1f2937; font-weight: 600; font-family: monospace; word-break: break-all; overflow-wrap: anywhere;">${password}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 20px 0;">
        <span style="display: inline-block; background-color: #e6f4ea; color: #059669; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; text-transform: uppercase;">Role: ${role.replace('_', ' ')}</span>
      </div>

      <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">Please change your password after your first login for security purposes.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const ticketCreatedHelpdeskTemplate = ( { customerName, ticketNo, category, circuitId }: any) => ( {
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
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const ticketAssignedToAgentTemplate = ( { ticketNo, customerName, agentName, category, circuitId }: any) => ( {
  subject: `Fab5: Ticket ID – ${ticketNo} – Assigned`,
  html: emeraldLayout(
    "Ticket Assigned",
    `
      <p>Dear Team,</p>
      <p>This is to inform that a complaint has been assigned with below details:</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Assigned To:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;">${agentName}</td>
          </tr>
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
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const ticketReassignedToAgentTemplate = ( { ticketNo, customerName, agentName, category, circuitId }: any) => ( {
  subject: `Fab5: Ticket ID – ${ticketNo} – Reassigned`,
  html: emeraldLayout(
    "Ticket Reassigned",
    `
      <p>Dear Team,</p>
      <p>This is to inform that a complaint has been reassigned with below details:</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Reassigned To:</td>
            <td style="padding: 6px 0; color: #1f2937; font-weight: 700; text-align: right;">${agentName}</td>
          </tr>
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
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});



// ---Customer Templates---

export const welcomeCustomerTemplate = ( { name, email, password }: any) => ( {
  subject: "Welcome to Fab5 Support Portal",
  html: emeraldLayout(
    "Account Created",
    `
      <p>Dear Customer,</p>
      <p>An account has been created for you on the Fab5 Support Portal. You can now log in to raise support tickets and track their status in real-time.</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #4b5563; padding-bottom: 6px;">Email Address: </td>
            <td style="color: #1f2937; font-weight: 600; word-break: break-word; overflow-wrap: break-word; ">${email}</td>
          </tr>
          <tr>
            <td style="color: #4b5563; padding-bottom: 6px;">Generated Password: </td>
            <td style="color: #1f2937; font-weight: 600; font-family: monospace; word-break: break-all; overflow-wrap: anywhere;">${password}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #6b7280;">For security purposes, you will be required to change your password during your first login.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const ticketCreatedTemplate = ( { ticketNo, circuitId }: any) => ( {
  subject: `Fab5: Complaint Registered Successfully | Ticket ID: ${ticketNo}${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
  html: emeraldLayout(
    "Complaint Registered",
    `
      <p>Dear Customer,</p>
      <p>This is to acknowledge that your complaint has been successfully registered in our system. Your Ticket ID is <strong>${ticketNo}</strong>. Please refer to this ID for any future communication regarding your concern.</p>
            
      <p>Thank you for your patience and cooperation.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const ticketAssignedCustomer2MinTemplate = ( { ticketNo, circuitId }: any) => ( {
  subject: `Fab5: Complaint Assigned for Investigation | Ticket ID: ${ticketNo}${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
  html: emeraldLayout(
    "Complaint Under Process",
    `
      <p>Dear Customer,</p>
      <p>We would like to inform you that your complaint has been assigned to the concerned department for further investigation and necessary action.</p>
            
      <p>Thank you for your patience and cooperation.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const ticketTroubleshootingCustomer15MinTemplate = ( { ticketNo, circuitId }: any) => ( {
  subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
  html: emeraldLayout(
    "Troubleshooting in Progress",
    `
      <p>Dear Customer,</p>
      <p>To expedite and prioritize the restoration of your services, we are performing detailed troubleshooting. The estimated resolution time is 45 minutes.</p>
            
      <p>Thank you for your patience and cooperation.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const mediaOutage45MinTemplate = ( { ticketNo, circuitId }: any) => ( {
  subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
  html: emeraldLayout(
    "Media Outage",
    `
      <p>Dear Customer,</p>
      <p>We regret to inform you that the link is currently affected due to an outage in Bharti media. Our team is actively coordinating with the concerned team to expedite the restoration of services. The Estimated Restoration Time is 4hrs.</p>
            
      <p>Thank you for your patience and cooperation.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const ticketUpdateByStaffTemplate = ( { ticketNo, agentName, message, circuitId }: any) => ( {
  subject: `Fab5: Update regarding your Ticket ID - ${ticketNo}${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
  html: emeraldLayout(
    "New Message Received",
    `
      <p>Dear Customer,</p>
      <p>Our support specialist, <strong>${agentName}</strong>, has provided an update on your ticket:</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; font-style: italic;">
        "${message}"
      </div>
            
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const ticketStatusUpdateTemplate = ( { ticketNo, status, updateType, circuitId }: any) => {
  if (updateType === "CLOSED" || status === "RESOLVED" || status === "CLOSED") {
    return ticketResolvedTemplate( { ticketNo, circuitId });
  }

  const config = {
    REOPENED: {
      title: "Complaint Reopened",
      subject: `Fab5: Your Complaint Has Been Reopened | Ticket ID: ${ticketNo}${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
      message: `Your ticket has been reopened. Our support team has been notified and will prioritize your request for further assistance.`
    },
    ESCALATED: {
      title: "Complaint Escalated",
      subject: `Fab5: Your Complaint Has Been Escalated | Ticket ID: ${ticketNo}${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
      message: `Your ticket has been escalated to our senior support management. We are dedicating extra resources to ensure a swift resolution.`
    }
  }[updateType as any] || {
    title: "Complaint Updated",
    subject: `Fab5: Status Update for Your Ticket | Ticket ID: ${ticketNo}${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
    message: `Your ticket status has been updated to ${status.replace('_', ' ')}.`
  };

  return {
    subject: config.subject,
    html: emeraldLayout(
      config.title,
      `
        <p>Dear Customer,</p>
        <p>${config.message}</p>
                
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
      `
    )
  };
};


export const ticketResolvedTemplate = ( { ticketNo, circuitId }: any) => ( {
  subject: `Fab5: Ticket ID – ${ticketNo} – Resolved${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
  html: emeraldLayout(
    "Complaint Resolved",
    `
      <p>Dear Customer,</p>
      <p>We are pleased to inform you that your complaint has been successfully resolved. With this, we are proceeding to close your complaint in our system. If you believe the issue has not been fully resolved or require any further assistance, then please reopen the ticket with 24 hrs.</p>
      <p>We would appreciate it if you could take a moment to share your feedback on portal of your experience with our support team. Your input is valuable and helps us improve our services.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

export const ticketRcaTemplate = ( { ticketNo, rca, rcaImages, circuitId }: any) => {
  const imagesHtml = rcaImages && rcaImages.length > 0 
    ? `
      <div style="margin-top: 20px;">
        <p style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">Attached Images:</p>
        <div>
          ${rcaImages.map((imgUrl: string) => `
            <div style="display: inline-block; margin-right: 12px; margin-bottom: 12px; vertical-align: top;">
              <img src="${imgUrl}" alt="RCA Attachment" style="max-width: 100px; height: auto; border-radius: 8px; border: 1px solid #e2e8f0;"/>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : '';

  return {
    subject: `Fab5: Root Cause Analysis - Ticket ID ${ticketNo}${circuitId ? ` ( Reference: ${circuitId})` : ''}`,
    html: emeraldLayout(
      "Root Cause Analysis Update",
      `
        <p>Dear Customer,</p>
        <p>Update on Root Cause Analysis of Reported Issue: <strong>${ticketNo}</strong> (Ticket ID)</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px; font-style: italic;">
          "${rca}"
        </div>

        ${imagesHtml}
        
        <p>Please feel free to reach out if you have any questions or need additional clarification.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
    )
  };
};




export const passwordResetOtpTemplate = ( { name, otpCode }: any) => ( {
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
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        <p style="margin: 0; font-size: 14px;">Best regards,<br/>Customer Support Team<br/><strong>Fab5 Network Pvt. Ltd.</strong><br/><span><span style="font-size: 18px; vertical-align: middle;">&#9742;</span><span style="vertical-align: middle;"> 9953637300</span></span><br/><span><span style="font-size: 20px; vertical-align: middle;">&#9993;</span><span style="vertical-align: middle;"> helpdesk@fab5network.com</span></span><br/></p>
      </div>
    `
  )
});

