import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 800;
    const from = 0;
    const to = Number(value) || 0;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(from + (to - from) * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const rounded = Number.isInteger(Number(value)) ? Math.round(display) : display.toFixed(1);
  return <span>{rounded}{suffix}</span>;
}

export default function StatCard({ icon: Icon, label, value, suffix = "", accent = "brand", delay = 0 }) {
  const accentMap = {
    brand: "from-brand-500 to-brand-600",
    green: "from-emerald-500 to-emerald-600",
    red: "from-rose-500 to-rose-600",
    amber: "from-amber-500 to-amber-600",
    purple: "from-violet-500 to-violet-600",
  };
  
  const gradientClass = accentMap[accent] || accentMap.brand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-5 hover:-translate-y-1 transition-transform duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
            <AnimatedNumber value={value} suffix={suffix} />
          </p>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradientClass} shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
}