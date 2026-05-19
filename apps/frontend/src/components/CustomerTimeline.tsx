import { format } from "date-fns";
import { useAuthStore } from "@/store/useAuthStore";

interface TicketEvent {
  id: number;
  event_type: string;
  message: string;
  actor_name: string | null;
  created_at: string;
  metadata: any;
}

interface TimelineProps {
  events: TicketEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  const { user } = useAuthStore();
  const isEmployee = user?.role !== "USER";

  // Filter out internal priority messages only for customers
  const visibleEvents = events.filter(e => {
    if (isEmployee) return true; // Employees see everything
    return (
      e.event_type !== "PRIORITY_ASSIGNED" &&
      e.event_type !== "PRIORITY_CHANGED"
    );
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "TICKET_CREATED":
        return "confirmation_number";
      case "TICKET_ASSIGNED":
        return "person_add";
      case "AGENT_REPLY":
      case "MANAGER_REPLY":
      case "ADMIN_REPLY":
        return "support_agent";
      case "USER_REPLY":
        return "person";
      case "SYSTEM_MESSAGE":
        return "robot_2";
      case "STATUS_CHANGED":
        return "published_with_changes";
      case "TICKET_RESOLVED":
        return "task_alt";
      default:
        return "info";
    }
  };

  const getRoleLabel = (type: string) => {
    switch (type) {
      case "AGENT_REPLY":
        return "Support Agent";
      case "MANAGER_REPLY":
        return "Support Manager";
      case "ADMIN_REPLY":
        return "Support Admin";
      default:
        return "Support Team";
    }
  };

  const getEventTitle = (event: TicketEvent) => {
    switch (event.event_type) {
      case "TICKET_CREATED":
        return "Ticket Opened";
      case "TICKET_ASSIGNED":
        return "Agent Assigned";
      case "STATUS_CHANGED":
        return `Status: ${event.metadata?.new_status || "Updated"}`;
      case "TICKET_RESOLVED":
        return "Ticket Resolved";
      case "AGENT_REPLY":
      case "ADMIN_REPLY":
      case "MANAGER_REPLY":
      case "USER_REPLY": {
        if (event.actor_name) {
          const firstName = event.actor_name.split(' ')[0];
          return `${firstName} Reply`;
        } else return "Customer Reply";
      }
      default:
        return "System Update";
    }
  };

  return (
    <section className="xl:col-span-2 px-0 pb-20 mt-10" data-purpose="ticket-timeline">
      <div className="relative pl-6 sm:pl-10 pb-8">
        {visibleEvents.map((event, index) => {
          const isUser = event.event_type === "TICKET_CREATED" || event.event_type === "USER_REPLY";
          const isLast = index === visibleEvents.length - 1 && events[0].event_type === "CLOSED";

          return (
            <div key={event.id} className="relative mb-12 timeline-item z-10">
              {/* Spine Line - Only show if not the very last overall node */}
              {index < visibleEvents.length - 1 && (
                <div className="absolute left-[-2px] sm:left-[-17px] top-10 bottom-[-48px] w-[2px] bg-slate-200 z-0" />
              )}

              {/* Node Dot */}
              <div className={`absolute -left-3 sm:-left-[32px] top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm`}>
                <span className="material-symbols-outlined text-lg text-slate-500">
                  {getEventIcon(event.event_type)}
                </span>
              </div>

              <div className={`mb-2 ml-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
                <h3 className="font-heading font-semibold text-lg text-black flex items-center gap-2">
                  {getEventTitle(event)}
                </h3>
              </div>

              {/* Message Card */}
              {event.message && event.message.trim() !== "" && (
                <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} items-start`}>
                  <div className={`flex flex-col gap-3 pl-2 ${isUser ? "items-end" : "items-start"} w-full min-w-0`}>
                    <div className={`max-w-[80%] flex flex-col gap-3 ${isUser ? "items-end text-right" : "items-start text-left"} min-w-0`}>
                      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1 text-slate-500 mb-1 font-semibold leading-normal`}>
                        <div className={`flex flex-row items-center gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                          <span className="text-xs font-body font-semibold">
                            {isUser
                              ? (isEmployee ? (event.actor_name || "Customer") : "You")
                              : (event.actor_name || "Samadhan AI")}
                          </span>
                          {["AGENT_REPLY", "MANAGER_REPLY", "ADMIN_REPLY"].includes(event.event_type) && (
                            <span className="text-xs font-body text-primary font-semibold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              {getRoleLabel(event.event_type)}
                            </span>
                          )}
                          <span className="text-xs font-body text-muted font-semibold ml-1">
                            {format(new Date(event.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl shadow-xs border overflow-hidden w-full ${isUser
                            ? "bg-emerald-700 text-white border-emerald-800 rounded-tr-sm"
                            : "bg-white text-slate-900 border-gray-200 rounded-tl-sm"
                          }`}>
                          <p className="text-[15px] leading-relaxed font-body font-medium  whitespace-pre-wrap">
                            {event.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>
    </section>
  );
}