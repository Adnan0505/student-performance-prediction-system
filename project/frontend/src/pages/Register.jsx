import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, User, Mail, Lock, UserPlus, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: signup, loading } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const onSubmit = async (data) => {
    const ok = await signup({ 
      name: data.name, 
      email: data.email, 
      password: data.password, 
      role: "admin" 
    });
    if (ok) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Premium Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-400/20 dark:bg-brand-500/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-400/20 dark:bg-violet-500/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md p-8 sm:p-10 relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 shadow-2xl dark:shadow-brand-900/20 rounded-3xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-lg shadow-brand-500/30 mb-4 ring-4 ring-brand-50 dark:ring-slate-800">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">
            Create account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Join the Performance Prediction Platform
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
            <div className="relative group">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input 
                type="text"
                maxLength={50}
                className="input-field pl-11 py-2.5 w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-brand-500/20 transition-all rounded-xl" 
                placeholder="your name" 
                {...register("name", { required: "Name is required" })} 
              />
            </div>
            {errors.name && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
            <div className="relative group">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input 
                type="email" 
                maxLength={60}
                className="input-field pl-11 py-2.5 w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-brand-500/20 transition-all rounded-xl" 
                placeholder="you@example.com" 
                {...register("email", { required: "Email is required" })} 
              />
            </div>
            {errors.email && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <div className="relative group">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                type={showPw ? "text" : "password"}
                maxLength={32}
                className="input-field pl-11 pr-11 py-2.5 w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-brand-500/20 transition-all rounded-xl"
                placeholder="At least 6 characters"
                {...register("password", { 
                  required: "Password is required", 
                  minLength: { value: 6, message: "Minimum 6 characters" } 
                })}
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg">
                {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2 text-[15px] font-semibold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
            <UserPlus className="w-4.5 h-4.5" /> {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
          Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700 dark:hover:text-brand-400 transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}