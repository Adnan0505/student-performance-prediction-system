import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { useTheme } from "./context/ThemeContext.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import StudentList from "./pages/students/StudentList.jsx";
import StudentProfile from "./pages/students/StudentProfile.jsx";
import PredictionPage from "./pages/predictions/PredictionPage.jsx";
import PredictionHistory from "./pages/predictions/PredictionHistory.jsx";
import Analytics from "./pages/Analytics.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import ModelComparison from "./pages/ModelComparison.jsx";
import ActivityLogs from "./pages/ActivityLogs.jsx";
import Settings from "./pages/Settings.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  const { dark } = useTheme();

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute adminOnly><StudentList /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
        <Route path="/predict" element={<ProtectedRoute><PredictionPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><PredictionHistory /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/model-comparison" element={<ProtectedRoute><ModelComparison /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute adminOnly><ActivityLogs /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme={dark ? "dark" : "light"}
        toastClassName="!rounded-xl !text-sm"
      />
    </>
  );
}
