import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";

const FIELD_DEFS = [
  { name: "name", label: "Full Name", type: "text" },
  { name: "roll_no", label: "Roll Number", type: "text" },
  { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
  { name: "age", label: "Age", type: "number" },
  { name: "attendance", label: "Attendance (%)", type: "number", step: "0.1" },
  { name: "internal_marks", label: "Internal Marks (/100)", type: "number", step: "0.1" },
  { name: "assignment_score", label: "Assignment Score (/100)", type: "number", step: "0.1" },
  { name: "study_hours", label: "Study Hours/day", type: "number", step: "0.1" },
  { name: "previous_marks", label: "Previous Marks (/100)", type: "number", step: "0.1" },
  { name: "ca1", label: "CA 1 Marks (/25)", type: "number", step: "0.1" },
  { name: "ca2", label: "CA 2 Marks (/25)", type: "number", step: "0.1" },
  { name: "ca3", label: "CA 3 Marks (/25)", type: "number", step: "0.1" },
  { name: "ca4", label: "CA 4 Marks (/25)", type: "number", step: "0.1" },
  { name: "pca1", label: "PCA 1 (Practical) (/40)", type: "number", step: "0.1" },
  { name: "pca2", label: "PCA 2 (Practical) (/40)", type: "number", step: "0.1" },
];

export default function StudentFormModal({ open, onClose, onSubmit, initialData, saving }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: initialData || {} });

  useEffect(() => {
    reset(initialData || { gender: "Male" });
  }, [initialData, open, reset]);

  const handleStrictInput = (e, fieldName) => {
    let val = e.target.value;

    if (fieldName === "name") {
      e.target.value = val.replace(/[^A-Za-z\s]/g, "");
    } else if (fieldName === "roll_no") {
      e.target.value = val.replace(/[^0-9]/g, "");
    } else if (fieldName === "age") {
      e.target.value = val.replace(/[^0-9]/g, "").slice(0, 2);
    } else if (fieldName === "study_hours") {
      if (Number(val) > 24) e.target.value = 24;
      if (Number(val) < 0) e.target.value = 0;
    } else if (["ca1", "ca2", "ca3", "ca4"].includes(fieldName)) {
      // CA marks strict limit: Max 25
      if (Number(val) > 25) e.target.value = 25;
      if (Number(val) < 0) e.target.value = 0;
    } else if (["pca1", "pca2"].includes(fieldName)) {
      // PCA marks strict limit: Max 40
      if (Number(val) > 40) e.target.value = 40;
      if (Number(val) < 0) e.target.value = 0;
    } else if (["attendance", "internal_marks", "assignment_score", "previous_marks"].includes(fieldName)) {
      // General marks strict limit: Max 100
      if (Number(val) > 100) e.target.value = 100;
      if (Number(val) < 0) e.target.value = 0;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="soft-card p-6 max-w-4xl w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
                {initialData?.id ? "Edit Student" : "Add New Student"}
              </h3>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-4 gap-3">
              {FIELD_DEFS.map((f) => (
                <div key={f.name} className={f.name === "name" ? "col-span-2" : "col-span-1"}>
                  <label className="label-text mb-1 block text-sm">{f.label}</label>
                  {f.type === "select" ? (
                    <select className="input-field w-full" {...register(f.name, { required: true })}>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      step={f.step}
                      className="input-field w-full"
                      {...register(f.name, { required: `${f.label} is required` })}
                      onInput={(e) => handleStrictInput(e, f.name)}
                    />
                  )}
                  {errors[f.name] && <p className="text-xs text-rose-500 mt-0.5">{errors[f.name].message}</p>}
                </div>
              ))}

              <div className="col-span-4 flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save Student"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}