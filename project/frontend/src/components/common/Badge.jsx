import React from "react";

const STYLES = {
  Pass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  Fail: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  Excellent: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  Good: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  Average: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  "At Risk": "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  A: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  B: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  C: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  D: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  F: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  random_forest: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",
  decision_tree: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
};

export default function Badge({ children, variant }) {
  const cls = STYLES[variant] || STYLES[children] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return <span className={`badge ${cls}`}>{children}</span>;
}
