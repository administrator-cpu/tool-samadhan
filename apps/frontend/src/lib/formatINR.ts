export function formatINR(outstandingBalance: number) {
  return `₹ ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(outstandingBalance)}`;
}