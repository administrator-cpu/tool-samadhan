export const getStatusBadgeConfig = (status: string) => {
  switch (status) {
    case "OPEN":
      return {
        dotClass: "bg-slate-400",
        pingClass: "bg-slate-600",
        textClass: "text-slate-600",
      };
    case "IN_PROGRESS":
      return {
        dotClass: "bg-amber-500",
        pingClass: "bg-amber-400",
        textClass: "text-amber-600",
      };
    case "ESCALATED":
      return {
        dotClass: "bg-red-500",
        pingClass: "bg-red-400",
        textClass: "text-red-600",
      };
    case "RESOLVED":
      return {
        dotClass: "bg-emerald-500",
        pingClass: "bg-emerald-400",
        textClass: "text-emerald-600",
      };
    case "CLOSED":
    default:
      return {
        dotClass: "bg-slate-400",
        pingClass: "bg-slate-300",
        textClass: "text-slate-500",
      };
  }
};