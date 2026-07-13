import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, ScrollText, Settings, History } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { EmptyState, TableSkeleton } from "../components/common/Feedback.jsx";
import api from "../services/api";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback((page = 1) => {
    setLoading(true);
    api.get("/logs", { params: { page, page_size: 15, search } })
      .then(({ data }) => { setLogs(data.logs); setPagination(data.pagination); })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  return (
    <DashboardLayout title="Activity Logs">
      <div className="glass-card p-6 mt-4">
        
        {/* Premium Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 shadow-inner">
              <ScrollText className="w-6 h-6 text-brand-600 dark:text-brand-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">System Activity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Track all user actions and events</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-72 group">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input 
              className="input-field pl-10 py-2.5 w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-brand-500/20 transition-all rounded-xl text-sm" 
              placeholder="Search actions..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} cols={3} />
        ) : logs.length === 0 ? (
          <EmptyState 
            icon={History}
            title="No activity recorded yet" 
            subtitle="Any changes or actions performed will appear here."
          />
        ) : (
          <div className="space-y-3 mb-6">
            {logs.map((log, i) => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                className="flex items-start sm:items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Premium Avatar / System Icon */}
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-105 transition-transform ${
                    log.user_name 
                      ? 'bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-500/20 dark:to-brand-500/10 text-brand-600 dark:text-brand-400' 
                      : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {log.user_name ? log.user_name.charAt(0).toUpperCase() : <Settings className="w-5 h-5" />}
                  </div>
                  
                  {/* Log Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      <span className="font-bold text-slate-900 dark:text-white mr-1.5">{log.user_name || "System"}</span>
                      <span className="text-slate-400 dark:text-slate-500 mr-1.5">•</span>
                      {log.action}
                    </p>
                    {log.details && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>

                {/* Modern Timestamp Format */}
                <div className="shrink-0 flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                    {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Pagination Box */}
        {logs.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <Pagination page={pagination.page} totalPages={pagination.total_pages} onChange={fetchLogs} />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}