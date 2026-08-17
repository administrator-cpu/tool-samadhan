export interface TicketEvent {
  id: number;
  event_type: string;
  message: string;
  actor_name: string | null;
  actor_translated_names?: Record<string, string> | null;
  created_at: string;
  metadata: any;
  translations?: Record<string, string>;
}

type Language = "en" | "hi" | "gu" | "bn";
const TITLE_TRANSLATIONS: Record< string, Partial<Record<Language, string>> > = {
  "Ticket Opened": {
    hi: "टिकट खोला गया",
    gu: "ટિકિટ ખુલી",
    bn: "টিকিট খোলা হয়েছে",
  },

  "Agent Assigned": {
    hi: "एजेंट को सौंपा गया",
  },

  "Expert Tech Support": {
    hi: "विशेषज्ञ तकनीकी सहायता",
  },

  "Root Cause Analysis": {
    hi: "मूल कारण विश्लेषण",
  },

  "Ticket Resolved": {
    hi: "टिकट हल किया गया",
  },

  "System Update": {
    hi: "सिस्टम अपडेट",
  },

  "Customer": {
    hi: "ग्राहक",
  },

  "Support": {
    hi: "समर्थन",
  },

  "Admin": {
    hi: "एडमिन",
  },

  "Troubleshooting": {
    hi: "समस्या निवारण",
  },

  "Issue Analysing": {
    hi: "समस्या का विश्लेषण",
  },

  'Status: "Resolved"': {
    hi: 'स्थिति: "हल किया गया"',
  },

  'Status: "Closed"': {
    hi: 'स्थिति: "बंद"',
  },

  'Status: "Reopened"': {
    hi: 'स्थिति: "फिर से खोला गया"',
  },

  'Status: "Escalated"': {
    hi: 'स्थिति: "एस्केलेट किया गया"',
  },

  'Status: "In Progress"': {
    hi: 'स्थिति: "प्रगति पर"',
  },

  'Status: "Updated"': {
    hi: 'स्थिति: "अपडेट किया गया"',
  }
};

function translateTitle( title: string, language: Language ): string {
  if (language === "en") {
    return title;
  }

  return TITLE_TRANSLATIONS[title]?.[language] ?? title;
}


export function getEventDetails( event: TicketEvent, language: Language ) {
    
    let title = "System Update";

    switch (event.event_type) {
        case "TICKET_CREATED":
            return {
                icon: "confirmation_number",
                title: translateTitle( "Ticket Opened", language )
            }
            
        case "TICKET_ASSIGNED":
            const isReassign = event.metadata?.is_reassign || (event.message && /reassigned/i.test(event.message));
            title = isReassign ? "Expert Tech Support" : "Agent Assigned";
            return {
                icon: "person_add",
                title: translateTitle( title, language )
            }

        case "SYSTEM_MESSAGE":
        case "AUTOMATED_UPDATE":
            title = event.metadata?.heading || "System Update"; 
            return {
                icon: "robot_2",
                title: translateTitle( title, language )
            }

        case "ADMIN_REPLY": {
            return {
                icon: "support_agent",
                title: translateTitle("Admin", language),
            };
        }

        case "AGENT_REPLY":
        case "MANAGER_REPLY":
        case "USER_REPLY": {
            const actorName = event.actor_name || event.metadata?.actor_name;
            const translatedName = event.actor_translated_names?.[language] || actorName;
            const fallbackTitle = event.event_type === "USER_REPLY" ? "Customer" : "Support";
            
            return {
                icon: event.event_type === "USER_REPLY" ? "person" : "support_agent",
                title: translatedName ? translatedName.split(" ")[0] : translateTitle(fallbackTitle, language),
            };
        }

        case "STATUS_CHANGED": {
            const rawStatus = event.metadata?.newStatus ?? event.metadata?.new_status ?? event.metadata?.status;
            const title = rawStatus ? `Status: "${formatStatus(rawStatus)}"` : 'Status: "Updated"';

            return {
                icon: "published_with_changes",
                title: translateTitle(title, language),
            };}

        case "TICKET_RCA_UPDATED":
            return {
                icon: "troubleshoot",
                title: translateTitle( "Root Cause Analysis", language )
            }

        case "TICKET_RESOLVED":
            return {
                icon: "task_alt",
                title: translateTitle( "Ticket Resolved", language )
            }

        default:
          return {
                icon: "info",
                title: translateTitle("System Update", language),
            }
    }


};


function formatStatus(rawStatus: string): string {
  return rawStatus
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}