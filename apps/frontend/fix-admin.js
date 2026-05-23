const fs = require('fs');

let content = fs.readFileSync('src/app/employee/admin/page.tsx', 'utf8');

content = content.replace(
`  const stats = dashboardStats as AdminStats;
  if (!stats) return null;

  const { summary, categories } = stats;

  // Dynamic Trend Calculation
  const last24 = Number(summary.tickets_last_24h);
  const prev24 = Number(summary.tickets_previous_24h);
  let trendPercent = 0;
  if (prev24 > 0) {
    trendPercent = Math.round(((last24 - prev24) / prev24) * 100);
  } else if (last24 > 0) {
    trendPercent = 100; // 100% increase from 0
  }`,
`  const stats = dashboardStats as any;
  if (!stats || !stats.ticketCounts) return null;

  const { ticketCounts, ticketsByCategory, agentWorkload, userCounts } = stats;

  const activeTickets = ticketCounts.OPEN + ticketCounts.IN_PROGRESS + ticketCounts.ESCALATED;
  const totalAgents = userCounts?.find((r: any) => r.role === 'SUPPORT_AGENT')?.count || '0';
  const activeAgents = agentWorkload?.filter((a: any) => Number(a.active_tickets) > 0).length || 0;

  // Dynamic Trend Calculation (Fallback since backend doesn't provide exact 24h metrics yet)
  let trendPercent = 0;`
);

content = content.replace(/summary\.total_tickets/g, "ticketCounts.TOTAL");
content = content.replace(/summary\.active_tickets/g, "activeTickets");
content = content.replace(/summary\.escalated_tickets/g, "ticketCounts.ESCALATED");
content = content.replace(/summary\.resolved_today/g, "ticketCounts.RESOLVED");
content = content.replace(/summary\.active_agents/g, "activeAgents");
content = content.replace(/summary\.total_agents/g, "totalAgents");
content = content.replace(/categories\?/g, "ticketsByCategory?");
content = content.replace(/stats\.categories/g, "stats.ticketsByCategory");

content = content.replace(
`                    {stats.agents?.map((agent) => {
                      const active = agent.active_assigned;

                      return (
                        <tr key={agent.employee_id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                            <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {agent.name}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className={\`inline-flex items-center justify-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-100\`}>
                              {active}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className="text-sm font-bold text-slate-600">
                              {agent.total_assigned}
                            </span>
                          </td>
                        </tr>
                      );
                    })}`,
`                    {stats.agentWorkload?.map((agent: any) => {
                      const active = agent.active_tickets;

                      return (
                        <tr key={agent.employee_id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                            <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {agent.agent_name}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className={\`inline-flex items-center justify-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-100\`}>
                              {active}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className="text-sm font-bold text-slate-600">
                              {agent.assigned_tickets}
                            </span>
                          </td>
                        </tr>
                      );
                    })}`
);

content = content.replace(
`                    {(!stats.agents || stats.agents.length === 0) && (`,
`                    {(!stats.agentWorkload || stats.agentWorkload.length === 0) && (`
);

fs.writeFileSync('src/app/employee/admin/page.tsx', content);
console.log("Fixed admin page");
