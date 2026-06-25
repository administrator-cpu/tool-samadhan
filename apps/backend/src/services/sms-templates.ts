export const ticketCreatedSmsTemplate = (ticketNo: string) => {
  return `Dear Customer, your complaint has been successfully registered. Your Ticket ID is ${ticketNo}. We will resolve it shortly. - Fab5 Network`;
};

export const troubleshootingUpdateSmsTemplate = (ticketNo: string, estimatedResolutionTime: string = '1-2 hours') => {
  return `Dear Customer, we are performing detailed troubleshooting on your Ticket ${ticketNo}. The estimated resolution time is ${estimatedResolutionTime}. - Fab5 Network`;
};

export const mediaOutageSmsTemplate = (message: string) => {
  return message;
};

export const staffUpdateSmsTemplate = (message: string) => {
  return message;
};

export const ticketReopenedSmsTemplate = (ticketNo: string) => {
  return `Dear Customer, your Ticket ID ${ticketNo} has been reopened. Our support team will prioritize your request for further assistance. - Fab5 Network`;
};

export const ticketResolvedSmsTemplate = (ticketNo: string) => {
  return `Dear Customer, your complaint (Ticket ID ${ticketNo}) has been resolved. If you require further assistance, please reopen within 24 hours. - Fab5 Network`;
};

export const rootCauseAnalysisSmsTemplate = (ticketNo: string) => {
  return `RCA for Ticket No. ${ticketNo} has been updated in Samadhan Portal. -Fab5 Network`;
};
