import React from "react";
import { NavLink } from "react-router-dom";
// Yahan se motion import hata diya gaya hai
import {
  LayoutDashboard, Users, Brain, History, BarChart3, Trophy,
  TrendingUp, ScrollText, GitCompare, X, GraduationCap,
} from "lucide-react";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users, adminOnly: true },
  { to: "/predict", label: "Run Prediction", icon: Brain },
  { to: "/history", label: "Prediction History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/model-comparison", label: "Model Comparison", icon: GitCompare },
  { to: "/logs", label: "Activity Logs", icon: ScrollText, adminOnly: true },
];

export default function Sidebar({ open, onClose, isAdmin }) {
  return (
    <>
      {/* Background Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity" 
          onClick={onClose} 
        />
      )}
      
      {/* motion.aside ki jagah normal aside use kiya hai taaki Tailwind sahi se kaam kare 👇 */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 z-[70] glass-card !rounded-none lg:!rounded-2xl
          lg:my-4 lg:ml-4 lg:h-[calc(100vh-2rem)] transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-lg shadow-brand-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white leading-none">SPPS</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Performance AI Platform</p>
            </div>
          </div>
          {/* Ye raha tumhara Close Button */}
          <button 
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
            onClick={onClose}
          >
            <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        <nav className="px-3 mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-100px)] pb-6">
          {LINKS.filter((l) => !l.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose} // Link par click karne se bhi mobile menu band ho jayega
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}