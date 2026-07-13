import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, AlertTriangle } from "lucide-react";

export function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", subtitle = "" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1 max-w-sm">{subtitle}</p>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="skeleton h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return <div className="skeleton h-28 w-full" />;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = true }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="soft-card p-6 max-w-sm w-full"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${danger ? "bg-rose-50 dark:bg-rose-500/10" : "bg-brand-50 dark:bg-brand-500/10"}`}>
                <AlertTriangle className={`w-5 h-5 ${danger ? "text-rose-600" : "text-brand-600"}`} />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={onCancel}>Cancel</button>
              <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>Confirm</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
