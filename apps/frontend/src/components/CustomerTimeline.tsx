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
      case "PRIORITY_ASSIGNED":
      case "PRIORITY_CHANGED":
        return "priority_high";
      case "AGENT_REPLY":
      case "MANAGER_REPLY":
      case "ADMIN_REPLY":
        return "support_agent";
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
      case "PRIORITY_ASSIGNED":
      case "PRIORITY_CHANGED":
        return "Priority Updated";
      case "STATUS_CHANGED":
        return `Status: ${event.metadata?.new_status || "Updated"}`;
      case "TICKET_RESOLVED":
        return "Ticket Resolved";
      case "AGENT_REPLY":
      case "MANAGER_REPLY":
      case "ADMIN_REPLY":
        return "New Reply";
      default:
        return "System Update";
    }
  };

  const getSLADetails = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const slaDeadline = new Date(createdDate.getTime() + 48 * 60 * 60 * 1000);
    const now = new Date();
    const totalSlaMs = 48 * 60 * 60 * 1000;
    const diffMs = slaDeadline.getTime() - now.getTime();
    const elapsedMs = now.getTime() - createdDate.getTime();
    
    const percentage = Math.min(100, Math.max(0, (diffMs / totalSlaMs) * 100));
    
    if (diffMs <= 0) {
      return { label: "Priority Resolution Pending", percentage: 0, isBreached: true };
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { 
      label: `${diffHours}h ${diffMinutes}m remaining`, 
      percentage, 
      isBreached: false 
    };
  };

  const ticketCreatedEvent = events.find(e => e.event_type === "TICKET_CREATED");
  const sla = ticketCreatedEvent ? getSLADetails(ticketCreatedEvent.created_at) : { label: "Calculating...", percentage: 0, isBreached: false };

  return (
    <section className="xl:col-span-2 px-10 pb-20 mt-10" data-purpose="ticket-timeline">
      <div className="relative pl-6 sm:pl-10 pb-8">
        {visibleEvents.map((event, index) => {
          const isUser = event.event_type === "TICKET_CREATED";
          const isLast = index === visibleEvents.length - 1 && events[0].event_type === "CLOSED";
          
          return (
            <div key={event.id} className="relative mb-12 timeline-item z-10">
              {/* Spine Line - Only show if not the very last overall node */}
              {(index < visibleEvents.length - 1 || events[0].event_type !== "CLOSED") && (
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
              <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} items-start`}>
                <div className={`flex flex-col gap-3 pl-2 ${isUser ? "items-end" : "items-start"} w-full`}>
                  <div className={`max-w-[80%] flex flex-col gap-3 ${isUser ? "items-end text-right" : "items-start text-left"}`}>
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
                      <div className={`p-3 rounded-2xl shadow-xs border ${
                        isUser 
                          ? "bg-emerald-700 text-white border-emerald-800 rounded-tr-sm" 
                          : "bg-white text-slate-900 border-gray-200 rounded-tl-sm"
                        } w-full`}>
                        <p className="text-[15px] leading-relaxed font-body font-medium">
                          {event.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Resolution Estimate Placeholder if not closed */}
        {events.length > 0 && events[0].event_type !== "CLOSED" && (
          <div className="relative timeline-item z-10">
            <div className="absolute -left-3 sm:-left-[32px] top-1 w-8 h-8 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center z-10 shadow-md">
              <span className="material-symbols-outlined text-lg text-amber-600 animate-pulse">timer</span>
            </div>

            <div className="mb-4 ml-2">
              <h3 className="font-heading font-semibold text-lg text-slate-900">Resolution SLA</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected Completion</p>
            </div>
            
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-6 shadow-xl shadow-slate-200/40 group max-w-sm ml-2">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-6xl">schedule</span>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined">alarm</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Time Remaining</p>
                    <p className={`text-xl font-black ${sla.isBreached ? 'text-red-600' : 'text-slate-900'}`}>{sla.label}</p>
                  </div>
                </div>
                
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      sla.isBreached 
                        ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                        : 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    }`} 
                    style={{ width: `${sla.percentage}%` }}
                  />
                </div>
                
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  Our team is committed to resolving your issue within the 48-hour window. You will receive an update as soon as progress is made.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}