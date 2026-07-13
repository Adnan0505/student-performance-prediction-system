import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 text-center">
      <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-lg shadow-brand-500/30 mb-4">
        <GraduationCap className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-5xl font-extrabold text-slate-800 dark:text-white">404</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
    </div>
  );
}
