export function formatINR(outstandingBalance: number) {

  console.log("Balance", outstandingBalance);
  return `₹ ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(outstandingBalance)}`;
}