import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';
import { tickets, customers, issueCategories } from '../database/drizzle/schema.js';

export function getTotalSecondsInMonth(year: number, month: number): number {
  // month: 1 = January, 12 = December
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth * 24 * 60 * 60;
}

export function getTotalMinutesInMonth(year: number, month: number): number {
  // month: 1 = January, 12 = December
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth * 24 * 60;
}

export function getTotalHoursInMonth(year: number, month: number): number {
  // month: 1 = January, 12 = December
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth * 24;
}

export class MetricService {
  static async getCustomerMetrics(userId: string, circuitId: string | null) {
    const parsedUserId = parseInt(userId, 10);
    
    // Fetch all tickets for the user
    let query = sql`
      SELECT 
        t.id, 
        t.ticket_no, 
        t.status, 
        t.created_at, 
        t.resolved_at, 
        t.circuit_description,
        ic.name as category_name
      FROM tickets t
      JOIN customers c ON c.id = t.customer_id
      LEFT JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
      WHERE c.user_id = ${parsedUserId}
    `;

    if (circuitId && circuitId !== 'ALL') {
      query = sql`${query} AND t.circuit_description = ${circuitId}`;
    }

    const result = await db.execute(query);
    const ticketsData = result.rows;

    // Helper to get last 12 months in YYYY-MM format
    const last12Months: { year: number; month: number; label: string }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last12Months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1, // 1-12
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      });
    }

    // Initialize data structures
    const monthlyUptimeTrend = last12Months.map(m => ({ name: m.label, uptime: 100 }));
    const totalFaultsByMonth = last12Months.map(m => ({ name: m.label, count: 0 }));
    const repeatFaultComparison = last12Months.map(m => ({ 
      name: m.label, 
      "Link Down": 0, 
      "Packet Drops": 0, 
      "Latency Very High": 0, 
      "Link Fluctuating": 0 
    }));
    const faultSeverity = last12Months.map(m => ({ name: m.label, Critical: 0, Medium: 0, Low: 0 }));
    const mttrTrend = last12Months.map(m => ({ name: m.label, mttr: 0 }));
    
    const faultCategoryDistributionMap = new Map<string, number>();

    // Helper for severity
    const getSeverity = (categoryName: string) => {
      const cat = (categoryName || '').toLowerCase();
      if (cat.includes('link down') || cat.includes('packet drops') || cat.includes('latency very high') || cat.includes('link fluctuating')) return 'Critical';
      if (cat.includes('bgp issue') || cat.includes('bts access') || cat.includes('slow browsing')) return 'Medium';
      return 'Low'; // Hardware configuration, IP Related, Others, Website Related Issue
    };

    // Process tickets
    // For uptime and MTTR, we need to accumulate downtime and MTTR per month
    const downtimePerMonth = new Map<string, number>();
    const resolveTimePerMonth = new Map<string, { totalHours: number, count: number }>();

    for (const row of ticketsData) {
      const createdDate = new Date(row.created_at as string);
      const resolvedDate = row.resolved_at ? new Date(row.resolved_at as string) : new Date(); // Use now if not resolved
      const categoryName = (row.category_name as string) || 'Others';
      const catLower = categoryName.toLowerCase();

      // Find which month this ticket falls into (based on created_at)
      const ticketYear = createdDate.getFullYear();
      const ticketMonth = createdDate.getMonth() + 1;
      const monthLabel = createdDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      // Total Faults By Month
      const tfbm = totalFaultsByMonth.find(m => m.name === monthLabel);
      if (tfbm) tfbm.count += 1;

      // Repeat Fault Comparison
      const rfc = repeatFaultComparison.find(m => m.name === monthLabel);
      if (rfc) {
        if (catLower.includes('link down')) rfc['Link Down'] += 1;
        else if (catLower.includes('packet drops')) rfc['Packet Drops'] += 1;
        else if (catLower.includes('latency very high')) rfc['Latency Very High'] += 1;
        else if (catLower.includes('link fluctuating')) rfc['Link Fluctuating'] += 1;
      }

      // Fault Category Distribution
      faultCategoryDistributionMap.set(categoryName, (faultCategoryDistributionMap.get(categoryName) || 0) + 1);

      // Fault Severity
      const fs = faultSeverity.find(m => m.name === monthLabel);
      if (fs) {
        fs[getSeverity(categoryName)] += 1;
      }

      // Link Down specific calculations
      if (catLower.includes('link down')) {
        // Calculate downtime in minutes
        const downtimeMinutes = (resolvedDate.getTime() - createdDate.getTime()) / (1000 * 60);
        downtimePerMonth.set(monthLabel, (downtimePerMonth.get(monthLabel) || 0) + Math.max(0, downtimeMinutes));

        // Calculate MTTR in hours (only for resolved tickets to be accurate, but user asked to include ongoing?)
        // Let's include ongoing using `now` or only resolved. Standard MTTR uses resolved tickets.
        if (row.resolved_at) {
          const resolveHours = (resolvedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
          const current = resolveTimePerMonth.get(monthLabel) || { totalHours: 0, count: 0 };
          current.totalHours += Math.max(0, resolveHours);
          current.count += 1;
          resolveTimePerMonth.set(monthLabel, current);
        }
      }
    }

    // Finalize Uptime and MTTR calculations
    for (let i = 0; i < last12Months.length; i++) {
      const monthData = last12Months[i];
      const monthLabel = monthData.label;

      // Uptime = (Total Available - Downtime) / Total Available * 100
      const totalMinutes = getTotalMinutesInMonth(monthData.year, monthData.month);
      const downtimeMinutes = downtimePerMonth.get(monthLabel) || 0;
      let uptime = ((totalMinutes - downtimeMinutes) / totalMinutes) * 100;
      if (uptime < 0) uptime = 0; // Cap at 0%
      monthlyUptimeTrend[i].uptime = parseFloat(uptime.toFixed(2));

      // MTTR = Total Hours / Count
      const mttrData = resolveTimePerMonth.get(monthLabel);
      if (mttrData && mttrData.count > 0) {
        mttrTrend[i].mttr = parseFloat((mttrData.totalHours / mttrData.count).toFixed(2));
      } else {
        mttrTrend[i].mttr = 0;
      }
    }

    // Convert map to array for donut chart
    const faultCategoryDistribution = Array.from(faultCategoryDistributionMap.entries()).map(([name, value]) => ({ name, value }));

    return {
      monthlyUptimeTrend,
      totalFaultsByMonth,
      repeatFaultComparison,
      faultCategoryDistribution,
      mttrTrend,
      faultSeverity
    };
  }
}
