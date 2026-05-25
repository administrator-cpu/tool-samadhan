import TicketDetailView from "@/components/TicketDetailView";

export default function AdminTicketDetailPage() {
  return (
    <TicketDetailView
      userRole="ADMIN"
      basePath="/employee/admin/tickets"
      replyEventType="ADMIN_REPLY"
    />
  );
}