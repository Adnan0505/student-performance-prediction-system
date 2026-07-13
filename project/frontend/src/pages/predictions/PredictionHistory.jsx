import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Search, Trash2, Download, History as HistoryIcon } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import { EmptyState, TableSkeleton, ConfirmDialog } from "../../components/common/Feedback.jsx";
import api, { downloadFile } from "../../services/api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function PredictionHistory() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
  const [search, setSearch] = useState("");
  const [result, setResult] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchHistory = useCallback((page = 1) => {
    setLoading(true);
    api.get("/predictions/history", { params: { page, page_size: 10, search, result, category } })
      .then(({ data }) => { setItems(data.history); setPagination(data.pagination); })
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false));
  }, [search, result, category]);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const handleDelete = async () => {
    try {
      await api.delete(`/predictions/history/${deleteTarget.id}`);
      toast.success("Prediction deleted");
      setDeleteTarget(null);
      fetchHistory(pagination.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const exportCsv = () => downloadFile("/predictions/history/export/csv", "prediction_history.csv").catch(() => toast.error("Export failed"));

  return (
    <DashboardLayout title="Prediction History">
      <div className="glass-card p-5 mt-4">
        <div className="flex flex-wrap items-center gap-3 justify-between mb-5">
          <div className="flex flex-wrap gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-field pl-10" placeholder="Search by student name..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-field w-auto" value={result} onChange={(e) => setResult(e.target.value)}>
              <option value="">All Results</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
            <select className="input-field w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="At Risk">At Risk</option>
            </select>
          </div>
          <button className="btn-secondary" onClick={exportCsv}><Download className="w-4 h-4" /> Export CSV</button>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : items.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="No prediction history" subtitle="Run predictions from the Prediction page to see them here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 pr-4">Student</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Algorithm</th>
                  <th className="py-3 pr-4">Grade</th>
                  <th className="py-3 pr-4">Result</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Confidence</th>
                  {isAdmin && <th className="py-3 pr-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{p.student_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{p.roll_no}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="py-3 pr-4"><Badge variant={p.algorithm}>{p.algorithm === "random_forest" ? "Random Forest" : "Decision Tree"}</Badge></td>
                    <td className="py-3 pr-4"><Badge variant={p.predicted_grade}>{p.predicted_grade}</Badge></td>
                    <td className="py-3 pr-4"><Badge variant={p.result}>{p.result}</Badge></td>
                    <td className="py-3 pr-4"><Badge variant={p.category}>{p.category}</Badge></td>
                    <td className="py-3 pr-4 text-slate-500">{p.confidence}%</td>
                    {isAdmin && (
                      <td className="py-3 pr-4">
                        <div className="flex justify-end">
                          <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={pagination.page} totalPages={pagination.total_pages} onChange={fetchHistory} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete prediction record?"
        message="This prediction will be permanently removed from history."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
