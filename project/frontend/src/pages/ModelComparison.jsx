import React, { useEffect, useState } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";
import { GitCompare, Network, TreePine } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import { CardSkeleton } from "../components/common/Feedback.jsx";
import api from "../services/api";

function ConfusionMatrix({ title, matrix, labels, color }) {
  const max = Math.max(...matrix.flat());
  return (
    <div className="glass-card p-5">
      <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{title} — Confusion Matrix</h3>
      <div className="overflow-x-auto">
        <table className="text-xs mx-auto">
          <thead>
            <tr>
              <th></th>
              {labels.map((l) => <th key={l} className="px-2 pb-1 text-slate-400 font-medium">Pred {l}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th className="pr-2 text-slate-400 font-medium text-right">True {labels[i]}</th>
                {row.map((val, j) => {
                  const intensity = max ? val / max : 0;
                  return (
                    <td key={j} className="p-1">
                      <div
                        className="w-11 h-11 flex items-center justify-center rounded-lg font-semibold text-xs"
                        style={{
                          backgroundColor: `${color}${Math.round(intensity * 200 + 20).toString(16).padStart(2, "0")}`,
                          color: intensity > 0.5 ? "white" : "#334155",
                        }}
                      >
                        {val}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ModelComparison() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/predictions/model-comparison").then(({ data }) => setMetrics(data.metrics)).finally(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return <DashboardLayout title="Model Comparison"><div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4"><CardSkeleton /><CardSkeleton /></div></DashboardLayout>;
  }

  const rf = metrics.random_forest;
  const dt = metrics.decision_tree;

  const radarData = [
    { metric: "Accuracy", "Random Forest": rf.accuracy * 100, "Decision Tree": dt.accuracy * 100 },
    { metric: "Precision", "Random Forest": rf.precision * 100, "Decision Tree": dt.precision * 100 },
    { metric: "Recall", "Random Forest": rf.recall * 100, "Decision Tree": dt.recall * 100 },
    { metric: "F1 Score", "Random Forest": rf.f1_score * 100, "Decision Tree": dt.f1_score * 100 },
  ];

  return (
    <DashboardLayout title="Model Comparison">
      <div className="glass-card p-5 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <GitCompare className="w-5 h-5 text-brand-600" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">Random Forest vs Decision Tree</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Evaluated on {metrics.test_samples} held-out test samples (trained on {metrics.trained_samples}).
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <ModelStatBlock icon={Network} title="Random Forest" color="brand" m={rf} />
            <ModelStatBlock icon={TreePine} title="Decision Tree" color="purple" m={dt} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" fontSize={12} />
                <PolarRadiusAxis domain={[0, 100]} fontSize={10} />
                <Radar name="Random Forest" dataKey="Random Forest" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                <Radar name="Decision Tree" dataKey="Decision Tree" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ConfusionMatrix title="Random Forest" matrix={rf.confusion_matrix} labels={rf.labels} color="#4f46e5" />
        <ConfusionMatrix title="Decision Tree" matrix={dt.confusion_matrix} labels={dt.labels} color="#a855f7" />
      </div>
    </DashboardLayout>
  );
}

function ModelStatBlock({ icon: Icon, title, color, m }) {
  const stats = [
    ["Accuracy", (m.accuracy * 100).toFixed(1) + "%"],
    ["Precision", (m.precision * 100).toFixed(1) + "%"],
    ["Recall", (m.recall * 100).toFixed(1) + "%"],
    ["F1 Score", (m.f1_score * 100).toFixed(1) + "%"],
  ];
  return (
    <div className="soft-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4.5 h-4.5 ${color === "brand" ? "text-brand-600" : "text-purple-600"}`} />
        <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{title}</p>
      </div>
      <div className="space-y-2">
        {stats.map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
