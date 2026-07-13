import React, { useEffect, useState } from "react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Target, BookOpen, FileText, Clock, Award, Activity 
} from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import Badge from "../components/common/Badge.jsx";
import { CardSkeleton, EmptyState } from "../components/common/Feedback.jsx";
import api from "../services/api";

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

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/overview").then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <DashboardLayout title="Analytics & Insights">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </DashboardLayout>
    );
  }

  // Upgraded Array with Premium Icons and Colors
  const avgCards = [
    { label: "Avg. Attendance", value: `${data.averages.attendance}%`, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Avg. Internal Marks", value: data.averages.internal_marks, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Avg. Assignment Score", value: data.averages.assignment_score, icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Avg. Study Hours", value: `${data.averages.study_hours}h`, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Avg. Previous Marks", value: data.averages.previous_marks, icon: Award, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  const growthChart = [...data.monthly_growth].reverse().map((m) => ({ month: m.month, marks: Math.round(m.avg_marks * 10) / 10 }));

  return (
    <DashboardLayout title="Analytics & Insights">
      
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        {avgCards.map((card, i) => (
          <div key={i} className="glass-card p-5 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{card.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Growth Chart */}
      <div className="glass-card p-6 mt-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <Activity className="w-5 h-5 text-brand-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Monthly Growth Trend (Avg. Final Marks)</h3>
        </div>
        
        {/* Pre-applied height fix for Recharts */}
        <div style={{ width: '100%', height: '320px' }}>
          {growthChart.length === 0 ? <EmptyState title="No trend data yet" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={customTooltipStyle} />
                <Bar dataKey="marks" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45}>
                   {growthChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === growthChart.length - 1 ? '#8b5cf6' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            Top Performers
          </h3>
          <StudentMiniTable rows={data.top_performers} />
        </div>
        
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <div className="p-1.5 rounded-lg bg-rose-500/10">
              <TrendingDown className="w-4.5 h-4.5 text-rose-500" />
            </div>
            Weak / At-Risk Students
          </h3>
          <StudentMiniTable rows={data.weak_students} />
        </div>
      </div>

    </DashboardLayout>
  );
}

// Upgraded Mini Table with Avatar and Hover Effects
function StudentMiniTable({ rows }) {
  if (!rows?.length) return <EmptyState title="No data available" />;
  
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group">
          <div className="flex items-center gap-3">
            {/* Premium Avatar Circle */}
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm shadow-inner group-hover:scale-105 transition-transform">
              {r.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{r.roll_no}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={r.predicted_grade}>{r.predicted_grade}</Badge>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-medium uppercase">Score</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.final_marks}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}