import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function DashboardLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} />
      
      {/* Yahan maine px-4 lg:px-6 add kiya hai taaki Topbar aur content left edge se na chipke */}
      <div className="flex-1 min-w-0 flex flex-col px-4 lg:px-6">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex-1 pb-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}