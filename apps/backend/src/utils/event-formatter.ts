type Language = "en" | "hi" | "gu" | "bn";

const TITLE_TRANSLATIONS: Record<string, Partial<Record<Language, string>>> = {
  "Ticket Opened": {
    hi: "टिकट खोला गया",
    gu: "ટિકિટ ખુલી",
    bn: "টিকিট খোলা হয়েছে",
  },
  "Agent Assigned": {
    hi: "एजेंट को सौंपा गया",
  },
  "Expert Tech Support": {
    hi: "तकनीकी विशेषज्ञ",
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
    hi: "प्राथमिक समस्या निवारण",
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
    hi: 'पुन: खोला गया',
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

function translateTitle(title: string, language: Language): string {
  if (language === "en") {
    return title;
  }
  return TITLE_TRANSLATIONS[title]?.[language] ?? title;
}

function formatStatus(rawStatus: string): string {
  return rawStatus
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

export function formatTicketEvent(event: any) {
  let baseTitle = "System Update";
  let icon = "info";
  let isDynamicTitle = false;
  let dynamicTitles: Record<string, string> = { en: "System Update" };

  switch (event.event_type) {
    case "TICKET_CREATED":
      icon = "confirmation_number";
      baseTitle = "Ticket Opened";
      break;

    case "TICKET_ASSIGNED": {
      const isReassign = event.metadata?.is_reassign || (event.message && /reassigned/i.test(event.message));
      baseTitle = isReassign ? "Expert Tech Support" : "Agent Assigned";
      icon = "person_add";
      break;
    }

    case "SYSTEM_MESSAGE":
    case "AUTOMATED_UPDATE":
      baseTitle = event.metadata?.heading || "System Update";
      icon = "robot_2";
      break;

    case "AGENT_REPLY":
    case "MANAGER_REPLY":
    case "ADMIN_REPLY":
    case "USER_REPLY": {
      const actorName = event.actor_name || event.metadata?.actor_name || "";
      
      let fallbackTitle = "Support";
      if (event.event_type === "USER_REPLY") fallbackTitle = "Customer";
      else if (event.event_type === "ADMIN_REPLY") fallbackTitle = "Admin";
      
      icon = event.event_type === "USER_REPLY" ? "person" : "support_agent";
      isDynamicTitle = true;

      // Construct dynamic translations for all supported languages
      const languages: Language[] = ["en", "hi", "gu", "bn"];
      languages.forEach((lang) => {
        if (event.event_type === "USER_REPLY") {
          dynamicTitles[lang] = translateTitle("Customer", lang);
        } else {
          const translatedName = event.actor_translated_names?.[lang] || actorName;
          dynamicTitles[lang] = translatedName ? translatedName.split(" ")[0] : translateTitle(fallbackTitle, lang);
        }
      });
      break;
    }

    case "STATUS_CHANGED": {
      const rawStatus = event.metadata?.newStatus ?? event.metadata?.new_status ?? event.metadata?.status;
      baseTitle = rawStatus ? `Status: "${formatStatus(rawStatus)}"` : 'Status: "Updated"';
      icon = "published_with_changes";
      break;
    }

    case "TICKET_RCA_UPDATED":
      icon = "troubleshoot";
      baseTitle = "Root Cause Analysis";
      break;

    case "TICKET_RESOLVED":
      icon = "task_alt";
      baseTitle = "Ticket Resolved";
      break;

    default:
      icon = "info";
      baseTitle = "System Update";
      break;
  }

  // If not dynamic, populate translations based on the baseTitle
  if (!isDynamicTitle) {
    const languages: Language[] = ["en", "hi", "gu", "bn"];
    languages.forEach((lang) => {
      dynamicTitles[lang] = translateTitle(baseTitle, lang);
    });
  }

  return {
    ...event,
    icon,
    title_translations: dynamicTitles
  };
}
