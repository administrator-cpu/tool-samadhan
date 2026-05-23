export var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["SUPPORT_AGENT"] = "SUPPORT_AGENT";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SALES"] = "SALES";
})(UserRole || (UserRole = {}));
export var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "OPEN";
    TicketStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TicketStatus["ESCALATED"] = "ESCALATED";
    TicketStatus["RESOLVED"] = "RESOLVED";
    TicketStatus["CLOSED"] = "CLOSED";
})(TicketStatus || (TicketStatus = {}));
export var TicketEventType;
(function (TicketEventType) {
    TicketEventType["TICKET_CREATED"] = "TICKET_CREATED";
    TicketEventType["TICKET_ASSIGNED"] = "TICKET_ASSIGNED";
    TicketEventType["STATUS_CHANGED"] = "STATUS_CHANGED";
    TicketEventType["AGENT_REPLY"] = "AGENT_REPLY";
    TicketEventType["USER_REPLY"] = "USER_REPLY";
    TicketEventType["INTERNAL_NOTE"] = "INTERNAL_NOTE";
    TicketEventType["ADMIN_REPLY"] = "ADMIN_REPLY";
    TicketEventType["SYSTEM_MESSAGE"] = "SYSTEM_MESSAGE";
    TicketEventType["OUTAGE_DETAILS_CHANGED"] = "OUTAGE_DETAILS_CHANGED";
    TicketEventType["TICKET_RCA_UPDATED"] = "TICKET_RCA_UPDATED";
    TicketEventType["REPLY_TOGGLED"] = "REPLY_TOGGLED";
})(TicketEventType || (TicketEventType = {}));
//# sourceMappingURL=enums.js.map