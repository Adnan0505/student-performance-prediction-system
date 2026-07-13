import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Search, Plus, Upload, Download, Trash2, Pencil, Eye, FileSpreadsheet, X,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import { EmptyState, TableSkeleton, ConfirmDialog } from "../../components/common/Feedback.jsx";
import StudentFormModal from "../../components/common/StudentFormModal.jsx";
import api, { downloadFile } from "../../services/api";

export default function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchStudents = useCallback((page = 1) => {
    setLoading(true);
    api.get("/students", { params: { page, page_size: 8, search, gender } })
      .then(({ data }) => { setStudents(data.students); setPagination(data.pagination); })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [search, gender]);

  useEffect(() => { fetchStudents(1); }, [fetchStudents]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editing?.id) {
        await api.put(`/students/${editing.id}`, formData);
        toast.success("Student updated");
      } else {
        await api.post("/students", formData);
        toast.success("Student added");
      }
      setModalOpen(false);
      setEditing(null);
      fetchStudents(pagination.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${deleteTarget.id}`);
      toast.success("Student deleted");
      setDeleteTarget(null);
      fetchStudents(pagination.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleExport = () => {
    downloadFile("/students/export/csv", "students_export.csv").catch(() => toast.error("Export failed"));
  };

  return (
    <DashboardLayout title="Student Management">
      <div className="glass-card p-5 mt-4">
        <div className="flex flex-wrap items-center gap-3 justify-between mb-5">
          <div className="flex flex-wrap gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input-field pl-10"
                placeholder="Search by name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="input-field w-auto" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" /> Bulk Upload
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : students.length === 0 ? (
          <EmptyState title="No students found" subtitle="Try adjusting your search or add a new student." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Roll No</th>
                  <th className="py-3 pr-4">Gender</th>
                  <th className="py-3 pr-4">Attendance</th>
                  <th className="py-3 pr-4">Internal Marks</th>
                  <th className="py-3 pr-4">Study Hrs</th>
                  <th className="py-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-700 dark:text-slate-200">{s.name}</td>
                    <td className="py-3 pr-4 text-slate-500 font-mono text-xs">{s.roll_no}</td>
                    <td className="py-3 pr-4 text-slate-500">{s.gender}</td>
                    <td className="py-3 pr-4">
                      <span className={s.attendance < 75 ? "text-rose-500 font-medium" : "text-emerald-600 font-medium"}>
                        {s.attendance}%
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{s.internal_marks}</td>
                    <td className="py-3 pr-4 text-slate-500">{s.study_hours}h</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-1.5">
                        <button title="View Profile" onClick={() => navigate(`/students/${s.id}`)} className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 text-brand-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button title="Edit" onClick={() => { setEditing(s); setModalOpen(true); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button title="Delete" onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={pagination.page} totalPages={pagination.total_pages} onChange={fetchStudents} />
      </div>

      <StudentFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSave}
        initialData={editing}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete student?"
        message={`This will permanently remove ${deleteTarget?.name} and all related prediction history.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <BulkUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onDone={() => fetchStudents(1)} />
    </DashboardLayout>
  );
}

function BulkUploadModal({ open, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  if (!open) return null;

  const handleUpload = async () => {
    if (!file) return toast.error("Choose a CSV file first");
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    try {
      const { data } = await api.post("/students/bulk-upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data);
      toast.success(data.message);
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => downloadFile("/students/template/csv", "student_upload_template.csv").catch(() => toast.error("Download failed"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="soft-card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-600" /> Bulk Upload Students
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Upload a CSV file with student records.</p>
        <button className="text-sm text-brand-600 font-medium hover:underline mb-4" onClick={downloadTemplate}>
          Download CSV template
        </button>
        <input
          type="file" accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="input-field mb-4"
        />
        {result && (
          <div className="text-xs bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4 text-slate-600 dark:text-slate-300">
            <p>Created: {result.created} · Skipped duplicates: {result.skipped} · Row errors: {result.row_errors?.length || 0}</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" disabled={uploading} onClick={handleUpload}>
            <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
