export const getSeverityConfig = (category: string) => {
  const catLower = (category || "").toLowerCase();
  if (
    catLower.includes("link down") ||
    catLower.includes("latency") ||
    catLower.includes("packet drop") ||
    catLower.includes("link fluctuating")
  ) {
    return { label: "CRITICAL", classes: "bg-red-100 text-red-700 border-red-200" };
  }
  if (
    catLower.includes("bgp issue") ||
    catLower.includes("bts access") ||
    catLower.includes("slow browsing")
  ) {
    return { label: "MEDIUM", classes: "bg-orange-100 text-orange-700 border-orange-200" };
  }
  return { label: "LOW", classes: "bg-yellow-100 text-yellow-700 border-yellow-200" };
};