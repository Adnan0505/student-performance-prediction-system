import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Lock, Moon, Sun, DatabaseBackup, Save } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api";

export default function Settings() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { dark, toggleDark } = useTheme();
  const { user, isAdmin } = useAuth();

  const onSubmit = async (data) => {
    try {
      await api.post("/auth/change-password", { old_password: data.old_password, new_password: data.new_password });
      toast.success("Password changed successfully");
      reset();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    }
  };

  const runBackup = async () => {
    try {
      const { data } = await api.post("/backup");
      toast.success(data.message);
    } catch (err) {
      toast.error("Backup failed");
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Lock className="w-4.5 h-4.5 text-brand-600" /> Change Password
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label-text">Current Password</label>
              <input type="password" className="input-field" {...register("old_password", { required: true })} />
            </div>
            <div>
              <label className="label-text">New Password</label>
              <input type="password" className="input-field" {...register("new_password", { required: true, minLength: 6 })} />
              {errors.new_password && <p className="text-xs text-rose-500 mt-1">Minimum 6 characters</p>}
            </div>
            <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> Update Password</button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Appearance</h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                {dark ? <Moon className="w-5 h-5 text-brand-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
                  <p className="text-xs text-slate-400">Preference is saved automatically</p>
                </div>
              </div>
              <button
                onClick={toggleDark}
                className={`w-12 h-7 rounded-full transition-colors relative ${dark ? "bg-brand-600" : "bg-slate-300"}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${dark ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="glass-card p-6">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <DatabaseBackup className="w-4.5 h-4.5 text-brand-600" /> Database Backup
              </h3>
              <p className="text-sm text-slate-400 mb-4">Create a timestamped backup copy of the SQLite database on the server.</p>
              <button className="btn-secondary" onClick={runBackup}>Run Backup Now</button>
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Account</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Name: <b className="text-slate-700 dark:text-slate-200">{user?.name}</b></p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Email: <b className="text-slate-700 dark:text-slate-200">{user?.email}</b></p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Role: <b className="text-slate-700 dark:text-slate-200 capitalize">{user?.role}</b></p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
