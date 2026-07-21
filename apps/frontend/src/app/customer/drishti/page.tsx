"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { graphCache } from "@/lib/cache";
import { useConnectionStore } from "@/store/useCircuitIDStore";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Sector } from "recharts";
import { ChartContainer, ChartTooltipContent, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
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

export default function CustomerMetricsPage() {
  const { connections, fetchConnections } = useConnectionStore();
  const [selectedCircuit, setSelectedCircuit] = useState<string>("ALL");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | undefined>();
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const cacheKey = `/tickets/customer-metrics?circuitId=${selectedCircuit}`;
      const cachedData = graphCache.get(cacheKey);

      if (cachedData) {
        setMetrics(cachedData);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(cacheKey);
        graphCache.set(cacheKey, response.data, 24); // Cache for 24 hours
        setMetrics(response.data);
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [selectedCircuit]);

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

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-10 md:px-12 md:py-14">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">
            Network Analytics
          </h1>
          <p className="text-slate-500 mt-1">
            Track performance and support metrics for your circuits.
          </p>
        </div>

        {/* <div className="flex items-center gap-3">
          <label htmlFor="circuit-select" className="text-sm font-semibold text-slate-700">
            Circuit ID:
          </label>
          <select
            id="circuit-select"
            className="rounded-lg border border-slate-200 bg-white/70 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            value={selectedCircuit}
            onChange={(e) => setSelectedCircuit(e.target.value)}
          >
            <option value="ALL">ALL</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.fabCircuitId}>
                {conn.fabCircuitId}
              </option>
            ))}
          </select>
        </div> */}
      </div>

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
          {/* 1. Monthly Uptime Trend - FULL WIDTH */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Monthly Uptime Trend</h3>
            <div className="h-[350px] w-full">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.monthlyUptimeTrend}>
                    <defs>
                      <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                    <YAxis domain={["auto", 100]} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} />
                    <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area 
                      type="monotone" 
                      dataKey="uptime" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fill="url(#colorUptime)" 
                      isAnimationActive={true}
                      animationBegin={400}
                      animationDuration={1500} 
                      animationEasing="ease-out"
                      activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 3 }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </motion.div>

          {/* 2. Total Faults by Month */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Total Faults by Month</h3>
            <div className="h-[300px] w-full">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.totalFaultsByMonth}>
                    <defs>
                      <linearGradient id="colorFaults" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorFaults)" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={40} 
                      isAnimationActive={true}
                      animationBegin={600}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      activeBar={{ stroke: '#10b981', strokeWidth: 2, fillOpacity: 0.8 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </motion.div>

          {/* 3. Fault Severity */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-shadow hover:shadow-md">
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
                    <Bar dataKey="Critical" stackId="a" fill="#ef4444" maxBarSize={50} isAnimationActive={true} animationBegin={1400} animationDuration={1000} activeBar={{ stroke: '#dc2626', strokeWidth: 2, fillOpacity: 0.8 }} />
                    <Bar dataKey="Medium" stackId="a" fill="#f59e0b" maxBarSize={50} isAnimationActive={true} animationBegin={1400} animationDuration={1200} activeBar={{ stroke: '#d97706', strokeWidth: 2, fillOpacity: 0.8 }} />
                    <Bar dataKey="Low" stackId="a" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} isAnimationActive={true} animationBegin={1400} animationDuration={1400} activeBar={{ stroke: '#2563eb', strokeWidth: 2, fillOpacity: 0.8 }} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </motion.div>

          {/* 4. Fault Category Distribution */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Fault Category Distribution</h3>
            <div className="h-[300px] w-full">
              {metrics.faultCategoryDistribution.length === 0 ? (
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
                        animationBegin={1000}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        {...({ activeIndex, activeShape: renderActiveShape } as any)}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(undefined)}
                      >
                        {metrics.faultCategoryDistribution.map((entry: any, index: number) => (
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
          <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-shadow hover:shadow-md">
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
                    <Bar dataKey="Link Down" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={true} animationBegin={800} animationDuration={1000} activeBar={{ stroke: '#e11d48', strokeWidth: 2, fillOpacity: 0.8 }} />
                    <Bar dataKey="Packet Drops" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={true} animationBegin={900} animationDuration={1100} activeBar={{ stroke: '#d97706', strokeWidth: 2, fillOpacity: 0.8 }} />
                    <Bar dataKey="Latency Very High" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={true} animationBegin={1000} animationDuration={1200} activeBar={{ stroke: '#7c3aed', strokeWidth: 2, fillOpacity: 0.8 }} />
                    <Bar dataKey="Link Fluctuating" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={true} animationBegin={1100} animationDuration={1300} activeBar={{ stroke: '#0284c7', strokeWidth: 2, fillOpacity: 0.8 }} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </motion.div>

          {/* 6. MTTR Trend - FULL WIDTH */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">MTTR Trend (Hours)</h3>
            <div className="h-[350px] w-full">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.mttrTrend}>
                    <defs>
                      <linearGradient id="colorMttr" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorMttr)" 
                      isAnimationActive={true}
                      animationBegin={1200}
                      animationDuration={1500} 
                      animationEasing="ease-out"
                      activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 3 }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 bg-slate-50/50">
          Failed to load metrics data.
        </div>
      )}
    </div>
  );
}