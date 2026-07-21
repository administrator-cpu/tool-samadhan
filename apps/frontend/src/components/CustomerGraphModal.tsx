"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Sector } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { motion, Variants } from "framer-motion";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#a855f7", "#f43f5e", "#0ea5e9", "#eab308", "#14b8a6"];

// Framer motion animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } },
};

interface Connection {
  id: string;
  fabCircuitId: string;
}

interface CustomerGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerRowId: number | null;
  customerName?: string;
}

export default function CustomerGraphModal({ isOpen, onClose, customerRowId, customerName } : CustomerGraphModalProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedCircuit, setSelectedCircuit] = useState<string>("ALL");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>();
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);

  // Fetch connections for the dropdown
  useEffect(() => {
    if (!isOpen || !customerRowId) {
      setConnectionsLoaded(false);
      return;
    }

    const fetchConnections = async () => {
      try {
        const response = await api.get(`/users/customers/${customerRowId}/connections`);
        setConnections(response.data.connections || []);
      } catch (err: any) {
        console.error("Failed to fetch connections:", err);
      } finally {
        setConnectionsLoaded(true);
      }
    };
    fetchConnections();
  }, [isOpen, customerRowId]);

  // Fetch metrics when modal opens or circuit changes
  useEffect(() => {
    if (!isOpen || !customerRowId || !connectionsLoaded) return;

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await api.get(
          `/users/customers/${customerRowId}/metrics?circuitId=${selectedCircuit}&totalCircuits=${connections.length}`
        );
        setMetrics(response.data);
      } catch (error) {
        console.error("Failed to fetch metrics", error);
        toast.error("Failed to fetch metrics for this customer");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [isOpen, customerRowId, selectedCircuit, connectionsLoaded, connections.length]);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#fff"
          strokeWidth={3}
          style={{ filter: `drop-shadow(0px 4px 10px ${fill}60)` }}
        />
      </g>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-600 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white font-heading">
              Network Analytics: {customerName || "Customer"}
            </h2>
            <p className="text-emerald-100 text-sm mt-1">
              Track performance and support metrics for this customer's circuits.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <label htmlFor="circuit-select" className="text-sm font-semibold text-white">
                Circuit ID:
              </label>
              <select
                id="circuit-select"
                className="rounded-lg cursor-pointer border border-slate-400 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none transition-all"
                value={selectedCircuit}
                onChange={(e) => setSelectedCircuit(e.target.value)}
              >
                <option value="ALL" className="cursor-pointer">ALL</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.fabCircuitId} className="cursor-pointer">
                    {conn.fabCircuitId}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white mt-1 md:mt-0 p-1 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto w-full">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-500"></div>
            </div>
          ) : metrics ? (
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {/* 1. Monthly Uptime Trend */}
              <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">Monthly Uptime Trend</h3>
                <div className="h-[350px] w-full">
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.monthlyUptimeTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUptimeModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                        <YAxis type="number" domain={[(dataMin: number) => Math.max(0, Math.min(Math.floor(dataMin), 98)), 100]} padding={{ top: 20, bottom: 0 }} allowDataOverflow={true} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} />
                        <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        <Area
                          type="monotone" 
                          dataKey="uptime" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          fill="url(#colorUptimeModal)" 
                          isAnimationActive={true}
                          animationBegin={200}
                          animationDuration={1000} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </motion.div>

              {/* 2. Total Faults by Month */}
              <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">Total Faults by Month</h3>
                <div className="h-[300px] w-full">
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.totalFaultsByMonth}>
                        <defs>
                          <linearGradient id="colorFaultsModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="20%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="80%" stopColor="#4feeb9ff" stopOpacity={0.9} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e2e2ff" strokeOpacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} allowDecimals={false} />
                        <Tooltip content={<ChartTooltipContent />} cursor={false} />
                        <Bar 
                          dataKey="count" 
                          fill="url(#colorFaultsModal)" 
                          radius={[6, 6, 0, 0]} 
                          maxBarSize={40} 
                          isAnimationActive={true}
                          animationBegin={300}
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </motion.div>

              {/* 3. Fault Severity */}
              <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">Fault Severity</h3>
                <div className="h-[300px] w-full">
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.faultSeverity}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} allowDecimals={false} />
                        <Tooltip content={<ChartTooltipContent />} cursor={false} />
                        <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                        <Bar dataKey="Critical" stackId="a" fill="#ef4444" maxBarSize={50} isAnimationActive={true} animationBegin={400} />
                        <Bar dataKey="Medium" stackId="a" fill="#f59e0b" maxBarSize={50} isAnimationActive={true} animationBegin={400} />
                        <Bar dataKey="Low" stackId="a" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} isAnimationActive={true} animationBegin={400} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </motion.div>

              {/* 4. Fault Category Distribution */}
              <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">Fault Category Distribution</h3>
                <div className="h-[300px] w-full">
                  {metrics.faultCategoryDistribution?.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-500">No data available</div>
                  ) : (
                    <ChartContainer config={{}} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metrics.faultCategoryDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            isAnimationActive={true}
                            animationBegin={500}
                            {...({ activeIndex, activeShape: renderActiveShape } as any)}
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(undefined)}
                          >
                            {metrics.faultCategoryDistribution?.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: "12px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </div>
              </motion.div>

              {/* 5. Repeat Fault Comparison */}
              <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">Repeat Fault Comparison</h3>
                <div className="h-[300px] w-full">
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.repeatFaultComparison}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} allowDecimals={false} />
                        <Tooltip content={<ChartTooltipContent />} cursor={false} />
                        <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                        <Bar dataKey="Link Down" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={true} animationBegin={600} />
                        <Bar dataKey="Packet Drops" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={true} animationBegin={600} />
                        <Bar dataKey="Latency Very High" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={true} animationBegin={600} />
                        <Bar dataKey="Link Fluctuating" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={true} animationBegin={600} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </motion.div>

              {/* 6. MTTR Trend */}
              <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">MTTR Trend (Hours)</h3>
                <div className="h-[350px] w-full">
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.mttrTrend}>
                        <defs>
                          <linearGradient id="colorMttrModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} />
                        <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        <Area 
                          type="monotone" 
                          dataKey="mttr" 
                          name="MTTR"
                          stroke="#8b5cf6" 
                          strokeWidth={3} 
                          fill="url(#colorMttrModal)" 
                          isAnimationActive={true}
                          animationBegin={700}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
