import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Medal, Star } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import Badge from "../components/common/Badge.jsx";
import { EmptyState, TableSkeleton } from "../components/common/Feedback.jsx";
import api from "../services/api";

const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-orange-500"];
const RANK_BG = ["bg-amber-500/10", "bg-slate-400/10", "bg-orange-500/10"];

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/analytics/leaderboard").then(({ data }) => setRows(data.leaderboard)).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Leaderboard">
      <div className="glass-card p-6 mt-4">
        
        {/* Premium Header Section */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div className="p-2.5 rounded-xl bg-amber-500/10 shadow-inner">
            <Trophy className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Top 10 Performers</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Ranked by predicted final marks</p>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : rows.length === 0 ? (
          <EmptyState 
            icon={Star} 
            title="No leaderboard data yet" 
            subtitle="Run predictions for students to populate the leaderboard." 
          />
        ) : (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <motion.div
                key={r.student_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                onClick={() => navigate(`/students/${r.student_id}`)}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group"
              >
                {/* Rank / Medal Section */}
                <div className="w-12 flex justify-center">
                  {r.rank <= 3 ? (
                    <div className={`p-2 rounded-full ${RANK_BG[r.rank - 1]} group-hover:scale-110 transition-transform`}>
                      <Medal className={`w-6 h-6 ${RANK_COLORS[r.rank - 1]}`} />
                    </div>
                  ) : (
                    <span className="text-base font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 w-8 h-8 flex items-center justify-center rounded-full">
                      #{r.rank}
                    </span>
                  )}
                </div>

                {/* Avatar Section */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-md flex items-center justify-center text-white text-sm font-bold group-hover:shadow-brand-500/30 transition-shadow">
                  {r.name.charAt(0).toUpperCase()}
                </div>

                {/* Student Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{r.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{r.roll_no}</p>
                </div>

                {/* Extra Stats (Hidden on very small screens) */}
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Attendance</span>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{r.attendance}%</span>
                </div>

                {/* Grade Badge */}
                <div className="mr-2">
                  <Badge variant={r.grade}>{r.grade}</Badge>
                </div>

                {/* Score / Marks */}
                <div className="flex flex-col items-end w-14">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Score</span>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">{r.marks}</span>
                </div>
                
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}