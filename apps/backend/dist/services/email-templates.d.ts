export declare const welcomeStaffTemplate: ({ name, email, password, role }: any) => {
    subject: string;
    html: string;
};
export declare const welcomeCustomerTemplate: ({ name, email, password }: any) => {
    subject: string;
    html: string;
};
export declare const ticketCreatedTemplate: ({ ticketNo }: any) => {
    subject: string;
    html: string;
};
export declare const ticketCreatedHelpdeskTemplate: ({ customerName, ticketNo, category, circuitId }: any) => {
    subject: string;
    html: string;
};
export declare const ticketAssignedCustomer2MinTemplate: ({ ticketNo }: any) => {
    subject: string;
    html: string;
};
export declare const ticketAssignedToAgentTemplate: ({ ticketNo, customerName, agentName, category, circuitId }: any) => {
    subject: string;
    html: string;
};
export declare const ticketTroubleshootingCustomer15MinTemplate: ({ ticketNo }: any) => {
    subject: string;
    html: string;
};
export declare const ticketResolvedTemplate: ({ ticketNo }: any) => {
    subject: string;
    html: string;
};
export declare const ticketRcaTemplate: ({ ticketNo, rca }: any) => {
    subject: string;
    html: string;
};
export declare const ticketUpdateByStaffTemplate: ({ ticketNo, agentName, message }: any) => {
    subject: string;
    html: string;
};
export declare const passwordResetOtpTemplate: ({ name, otpCode }: any) => {
    subject: string;
    html: string;
};
export declare const ticketStatusUpdateTemplate: ({ ticketNo, status, updateType }: any) => {
    subject: any;
    html: string;
};
export declare const troubleshootingUpdateTemplate: ({ ticketNo }: any) => {
    subject: string;
    html: string;
};
export declare const longDelayUpdateTemplate: ({ ticketNo }: any) => {
    subject: string;
    html: string;
};
//# sourceMappingURL=email-templates.d.ts.map