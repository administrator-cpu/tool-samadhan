import TicketDetailView from "@/components/TicketDetailView";

export default function AgentTicketDetailPage() {
  return (
    <TicketDetailView
      userRole="AGENT"
      basePath="/employee/support-agent/tickets"
      replyEventType="AGENT_REPLY"
    />
  );
}