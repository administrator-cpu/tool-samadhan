function getTotalSecondsInMonth(year: number, month: number): number {
  // month: 1 = January, 12 = December
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth * 24 * 60 * 60;
}

function getTotalMinutesInMonth(year: number, month: number): number {
  // month: 1 = January, 12 = December
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth * 24 * 60;
}

function getTotalHoursInMonth(year: number, month: number): number {
  // month: 1 = January, 12 = December
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth * 24;
}