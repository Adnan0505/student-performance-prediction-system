import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ArrowLeft, Brain, Mail, User } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Badge from "../../components/common/Badge.jsx";
import { EmptyState, CardSkeleton } from "../../components/common/Feedback.jsx";
import api from "../../services/api";

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/students/${id}`).then(({ data }) => {
      setStudent(data.student);
      setPredictions(data.predictions);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <DashboardLayout title="Student Profile"><div className="mt-4 space-y-4"><CardSkeleton /><CardSkeleton /></div></DashboardLayout>;
  }
  if (!student) {
    return <DashboardLayout title="Student Profile"><EmptyState title="Student not found" /></DashboardLayout>;
  }

  const progressData = [...predictions].reverse().map((p) => ({
    date: new Date(p.created_at).toLocaleDateString(),
    marks: p.final_marks,
  }));

  const infoRows = [
    ["Roll Number", student.roll_no],
    ["Gender", student.gender],
    ["Age", student.age],
    ["Attendance", `${student.attendance}%`],
    ["Internal Marks", `${student.internal_marks}/100`],
    ["Assignment Score", `${student.assignment_score}/100`],
    ["Study Hours/day", student.study_hours],
    ["Previous Sem Marks", `${student.previous_marks}/100`],
  ];

  return (
    <DashboardLayout title="Student Profile">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 mt-4 mb-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold mb-3">
              {student.name[0]}
            </div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">{student.name}</h2>
            <p className="text-sm text-slate-400 font-mono">{student.roll_no}</p>
          </div>
          <div className="space-y-2.5 text-sm">
            {infoRows.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-50 dark:border-slate-800/60 pb-2">
                <span className="text-slate-400">{label}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{value}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary w-full mt-5" onClick={() => navigate(`/predict?student=${student.id}`)}>
            <Brain className="w-4 h-4" /> Run New Prediction
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Performance Progress Over Time</h3>
            <div className="h-56">
              {progressData.length === 0 ? (
                <EmptyState title="No predictions yet" subtitle="Run a prediction to start tracking progress." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={12} domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="marks" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Prediction History</h3>
            {predictions.length === 0 ? (
              <EmptyState title="No predictions recorded" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Algorithm</th>
                      <th className="py-2 pr-4">Grade</th>
                      <th className="py-2 pr-4">Result</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/60">
                        <td className="py-2.5 pr-4 text-slate-500 text-xs">{new Date(p.created_at).toLocaleString()}</td>
                        <td className="py-2.5 pr-4"><Badge variant={p.algorithm}>{p.algorithm === "random_forest" ? "Random Forest" : "Decision Tree"}</Badge></td>
                        <td className="py-2.5 pr-4"><Badge variant={p.predicted_grade}>{p.predicted_grade}</Badge></td>
                        <td className="py-2.5 pr-4"><Badge variant={p.result}>{p.result}</Badge></td>
                        <td className="py-2.5 pr-4"><Badge variant={p.category}>{p.category}</Badge></td>
                        <td className="py-2.5 pr-4 text-slate-500">{p.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
