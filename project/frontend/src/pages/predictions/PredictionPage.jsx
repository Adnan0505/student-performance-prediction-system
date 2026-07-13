import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  Search, Brain, Zap, Download, Mail, AlertTriangle, CheckCircle2,
  XCircle, Clock, TreePine, Network, Lightbulb, X,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Badge from "../../components/common/Badge.jsx";
import { EmptyState } from "../../components/common/Feedback.jsx";
import api, { downloadFile } from "../../services/api";

function FactorBar({ label, percent, direction, delay }) {
  const color = direction === "negative" ? "bg-rose-500" : direction === "positive" ? "bg-emerald-500" : "bg-slate-400";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{percent}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.7, delay }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function PredictionPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [algorithm, setAlgorithm] = useState("random_forest");
  const [prediction, setPrediction] = useState(null);
  const [running, setRunning] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => {
    const studentId = searchParams.get("student");
    if (studentId) {
      api.get(`/students/${studentId}`).then(({ data }) => setSelected(data.student));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const t = setTimeout(() => {
      api.get("/students", { params: { search: query, page_size: 6 } }).then(({ data }) => setResults(data.students));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const runPrediction = async () => {
    if (!selected) return toast.error("Select a student first");
    setRunning(true);
    setPrediction(null);
    try {
      const { data } = await api.post(`/predictions/run/${selected.id}`, { algorithm });
      setPrediction(data.prediction);
      toast.success("Prediction generated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Prediction failed");
    } finally {
      setRunning(false);
    }
  };

  const downloadPdf = () => {
    if (!prediction?.prediction_id) return;
    downloadFile(`/reports/pdf/${prediction.prediction_id}`, `${selected?.roll_no || "student"}_report.pdf`)
      .catch(() => toast.error("PDF download failed"));
  };

  return (
    <DashboardLayout title="Run Prediction">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="glass-card p-5 lg:col-span-1 h-fit">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">1. Select Student</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-10"
              placeholder="Search by name or roll number..."
              value={selected ? `${selected.name} (${selected.roll_no})` : query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            />
            {selected && (
              <button onClick={() => { setSelected(null); setQuery(""); setPrediction(null); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {results.length > 0 && !selected && (
            <div className="mt-2 soft-card p-1.5 max-h-56 overflow-y-auto">
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); setQuery(""); setResults([]); setPrediction(null); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                >
                  <p className="font-medium text-slate-700 dark:text-slate-200">{s.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{s.roll_no}</p>
                </button>
              ))}
            </div>
          )}

          {/* Ye raha tumhara update kiya hua Data block (2-column grid ke sath) */}
          {selected && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
              <div className="grid grid-cols-2 gap-y-2 gap-x-2">
                <p>Attend: <b className="text-slate-700 dark:text-slate-200">{selected.attendance}%</b></p>
                <p>Study: <b className="text-slate-700 dark:text-slate-200">{selected.study_hours}h/d</b></p>
                <p>CA1: <b className="text-slate-700 dark:text-slate-200">{selected.ca1}/25</b></p>
                <p>CA2: <b className="text-slate-700 dark:text-slate-200">{selected.ca2}/25</b></p>
                <p>CA3: <b className="text-slate-700 dark:text-slate-200">{selected.ca3}/25</b></p>
                <p>CA4: <b className="text-slate-700 dark:text-slate-200">{selected.ca4}/25</b></p>
                <p>PCA1: <b className="text-slate-700 dark:text-slate-200">{selected.pca1}/40</b></p>
                <p>PCA2: <b className="text-slate-700 dark:text-slate-200">{selected.pca2}/40</b></p>
              </div>
            </div>
          )}

          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mt-6 mb-3">2. Choose Algorithm</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAlgorithm("random_forest")}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                algorithm === "random_forest" ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-slate-100 dark:border-slate-800"
              }`}
            >
              <Network className="w-5 h-5 text-brand-600" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Random Forest</span>
            </button>
            <button
              onClick={() => setAlgorithm("decision_tree")}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                algorithm === "decision_tree" ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10" : "border-slate-100 dark:border-slate-800"
              }`}
            >
              <TreePine className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Decision Tree</span>
            </button>
          </div>

          <button onClick={runPrediction} disabled={running || !selected} className="btn-primary w-full mt-5">
            <Brain className="w-4 h-4" /> {running ? "Predicting..." : "Run Prediction"}
          </button>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!prediction ? (
              <div className="glass-card p-5 h-full flex items-center justify-center min-h-[400px]">
                <EmptyState icon={Brain} title="No prediction yet" subtitle="Select a student and run a prediction to see explainable AI results here." />
              </div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="glass-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      {prediction.result === "Pass" ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-rose-500" />}
                      <div>
                        <p className="font-bold text-lg text-slate-800 dark:text-white">{selected?.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{selected?.roll_no}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={downloadPdf}><Download className="w-4 h-4" /> PDF</button>
                      <button className="btn-secondary" onClick={() => setEmailOpen(true)}><Mail className="w-4 h-4" /> Email</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MiniStat label="Grade" value={<Badge variant={prediction.predicted_grade}>{prediction.predicted_grade}</Badge>} />
                    <MiniStat label="Result" value={<Badge variant={prediction.result}>{prediction.result}</Badge>} />
                    <MiniStat label="Category" value={<Badge variant={prediction.category}>{prediction.category}</Badge>} />
                    <MiniStat label="Confidence" value={<span className="font-bold text-brand-600">{prediction.confidence}%</span>} />
                    <MiniStat label="Final Marks" value={<span className="font-bold">{prediction.final_marks}/100</span>} />
                    <MiniStat label="Algorithm" value={<Badge variant={prediction.algorithm}>{prediction.algorithm === "random_forest" ? "Random Forest" : "Decision Tree"}</Badge>} />
                    <MiniStat label="Prediction Time" value={<span className="flex items-center gap-1 text-slate-500"><Clock className="w-3.5 h-3.5" />{prediction.prediction_time_ms}ms</span>} />
                  </div>
                </div>

                {prediction.is_at_risk && (
                  <div className="glass-card p-5 border-2 border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <h3 className="font-semibold text-rose-700 dark:text-rose-400">Student is at Risk</h3>
                    </div>
                    <p className="text-sm text-rose-600 dark:text-rose-400 mb-2"><b>Reasons:</b> {prediction.risk_reasons.join(", ")}</p>
                    <p className="text-sm text-rose-600 dark:text-rose-400"><b>Suggested Action:</b> {prediction.suggested_actions.join(", ")}</p>
                  </div>
                )}

                <div className="glass-card p-5">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Explainable AI</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Most important factor: <b className="text-brand-600">{prediction.explanation.most_important_factor}</b>
                  </p>
                  <div className="space-y-3.5">
                    {prediction.explanation.ranked_factors.map((f, i) => (
                      <FactorBar key={f.key} label={f.feature} percent={f.percent} direction={prediction.explanation.direction[f.key]} delay={i * 0.08} />
                    ))}
                  </div>
                </div>

                <div className="glass-card p-5">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4.5 h-4.5 text-amber-500" /> Recommendations
                  </h3>
                  <div className="space-y-3">
                    {prediction.recommendations.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{r.issue}</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{r.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <EmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        predictionId={prediction?.prediction_id}
      />
    </DashboardLayout>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function EmailModal({ open, onClose, predictionId }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  if (!open) return null;

  const send = async () => {
    if (!email) return toast.error("Enter a recipient email");
    setSending(true);
    try {
      const { data } = await api.post(`/reports/email/${predictionId}`, { email });
      if (data.success) toast.success(data.message);
      else toast.warn(data.message);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="soft-card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Email Prediction Report</h3>
        <input type="email" className="input-field mb-4" placeholder="recipient@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={sending} onClick={send}>
            <Mail className="w-4 h-4" /> {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}