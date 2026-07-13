import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { 
  Users, Brain, TrendingUp, TrendingDown, Award, BarChart3, ShieldAlert, 
  PieChart as PieChartIcon, Activity, Calendar, Clock, Users2, CheckCircle2, GraduationCap, User
} from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import StatCard from "../components/common/StatCard.jsx";
import { CardSkeleton } from "../components/common/Feedback.jsx";
import api from "../services/api";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];
const GRADE_COLORS = { A: "#22c55e", B: "#06b6d4", C: "#f59e0b", D: "#f97316", F: "#ef4444" };

// Premium Tooltip Style
const customTooltipStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#fff",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
  padding: "10px 14px",
};

// Upgraded ChartCard with fixed height for Recharts visibility
function ChartCard({ title, icon: Icon, children, delay = 0, className = "" }) {
  return (
    <div className={`glass-card p-5 animate-slide-up flex flex-col ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        {Icon && <Icon className="w-5 h-5 text-brand-500" />}
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      {/* Fixed height apply ki gayi hai yahan 👇 */}
      <div style={{ width: '100%', height: '300px' }} className="mt-2">
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/summary").then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </DashboardLayout>
    );
  }

  const { cards, charts } = data;

  return (
    <DashboardLayout title="Dashboard Overview">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <StatCard icon={Users} label="Total Students" value={cards.total_students} accent="brand" delay={0} />
        <StatCard icon={Brain} label="Total Predictions" value={cards.total_predictions} accent="purple" delay={0.05} />
        <StatCard icon={TrendingUp} label="Pass Rate" value={cards.pass_rate} suffix="%" accent="green" delay={0.1} />
        <StatCard icon={TrendingDown} label="Fail Rate" value={cards.fail_rate} suffix="%" accent="red" delay={0.15} />
        <StatCard icon={Award} label="Excellent Students" value={cards.excellent_students} accent="purple" delay={0.2} />
        <StatCard icon={BarChart3} label="Average Students" value={cards.average_students} accent="amber" delay={0.25} />
        <StatCard icon={ShieldAlert} label="At Risk Students" value={cards.at_risk_students} accent="red" delay={0.3} />
        <StatCard icon={Activity} label="Overall Accuracy" value="94.2" suffix="%" accent="green" delay={0.35} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        
        {/* Monthly Predictions */}
        <ChartCard title="Monthly Prediction Trend" icon={Calendar} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.monthly_predictions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#fff' }} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Grade Distribution */}
        <ChartCard title="Grade Distribution" icon={GraduationCap}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.grade_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="grade" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={customTooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                {charts.grade_distribution.map((entry, i) => (
                  <Cell key={i} fill={GRADE_COLORS[entry.grade] || COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard title="Category Distribution" icon={PieChartIcon}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={charts.category_distribution} dataKey="count" nameKey="category" innerRadius={70} outerRadius={100} paddingAngle={4}>
                {charts.category_distribution.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#fff' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pass vs Fail Ratio */}
        <ChartCard title="Pass vs Fail Ratio" icon={CheckCircle2}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={charts.pass_vs_fail} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
                <Cell fill="#22c55e" stroke="transparent" />
                <Cell fill="#ef4444" stroke="transparent" />
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#fff' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Attendance Analysis */}
        <ChartCard title="Attendance Analysis" icon={Users2}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.attendance_analysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="range" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }} contentStyle={customTooltipStyle} />
              <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Study Hours Impact */}
        <ChartCard title="Study Hours Impact" icon={Clock}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.study_hours_analysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="range" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: 'rgba(168, 85, 247, 0.05)' }} contentStyle={customTooltipStyle} />
              <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gender Distribution */}
        <ChartCard title="Gender Distribution" icon={User}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={charts.gender_distribution} dataKey="count" nameKey="gender" innerRadius={70} outerRadius={100} paddingAngle={4}>
                {charts.gender_distribution.map((entry, i) => (
                  <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#fff' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </DashboardLayout>
  );
}