import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { KeyRound, Mail, GraduationCap } from "lucide-react";
import api from "../services/api";

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm();
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { data: res } = await api.post("/auth/forgot-password", { email: data.email });
      setSent(true);
      if (res.dev_reset_token) setDevToken(res.dev_reset_token);
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-lg shadow-brand-500/30 mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Reset your password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
            Enter your email and we'll send you a reset link (email-ready — configure SMTP in the backend .env).
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" className="input-field pl-10" placeholder="you@example.com" {...register("email", { required: true })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              <KeyRound className="w-4 h-4" /> {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
            <p>If that account exists, a reset link has been sent to your inbox.</p>
            {devToken && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                SMTP isn't configured, so here's your demo reset token: <span className="font-mono break-all">{devToken}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}
