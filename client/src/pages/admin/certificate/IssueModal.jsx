import React, { useState, useMemo } from "react";
import {
  useGetCourseStudentsQuery,
  useGetIssuedForTemplateQuery,
  useIssueCertificatesMutation,
} from "@/features/api/certificateApi";
import { Loader2, Award, CheckCircle2, XCircle, Users } from "lucide-react";
import { toast } from "sonner";

const IssueModal = ({ templateId, onClose }) => {
  const { data: studentsData, isLoading: loadingStudents } = useGetCourseStudentsQuery(templateId);
  const { data: issuedData } = useGetIssuedForTemplateQuery(templateId);
  const [issueCerts, { isLoading: issuing }] = useIssueCertificatesMutation();

  const [selected, setSelected] = useState(new Set());

  const students = studentsData?.students || [];
  const alreadyIssued = useMemo(
    () => new Set((issuedData?.certificates || []).map((c) => c.issuedTo?._id?.toString())),
    [issuedData]
  );

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const eligible = students.filter((s) => !alreadyIssued.has(s._id));
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((s) => s._id)));
    }
  };

  const handleIssue = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one student.");
      return;
    }
    try {
      const res = await issueCerts({ id: templateId, studentIds: [...selected] }).unwrap();
      toast.success(res.message);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to issue certificates.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Award className="text-amber-600 shrink-0" size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-light text-gray-800">Issue Certificates</h2>
            <p className="text-sm font-light text-gray-500">Select enrolled students to issue</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle size={22} />
          </button>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-455 font-light">
              <Users size={40} className="mx-auto mb-2 opacity-40" />
              <p>No enrolled students found.</p>
            </div>
          ) : (
            <>
              {/* Select all */}
              <button
                onClick={toggleAll}
                className="text-sm text-amber-600 hover:underline mb-3 font-light"
              >
                {selected.size === students.filter((s) => !alreadyIssued.has(s._id)).length
                  ? "Deselect All"
                  : "Select All Eligible"}
              </button>

              <div className="flex flex-col gap-2">
                {students.map((s) => {
                  const certified = alreadyIssued.has(s._id);
                  return (
                    <label
                      key={s._id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer font-light ${
                        certified
                          ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                          : selected.has(s._id)
                          ? "bg-amber-50 border-amber-300"
                          : "border-gray-200 hover:border-amber-200 hover:bg-amber-50/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={certified}
                        checked={selected.has(s._id)}
                        onChange={() => toggle(s._id)}
                        className="accent-amber-500 w-4 h-4"
                      />
                      {s.photoUrl ? (
                        <img src={s.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-light text-sm">
                          {s.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-light text-gray-800 truncate">{s.name}</p>
                        <p className="text-xs font-light text-gray-400 truncate">{s.email}</p>
                      </div>
                      {certified && (
                        <span className="flex items-center gap-1 text-xs text-green-600 shrink-0 font-light">
                          <CheckCircle2 size={14} /> Issued
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between gap-3">
          <p className="text-sm font-light text-gray-500">
            {selected.size} student{selected.size !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-light transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleIssue}
              disabled={issuing || selected.size === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-light transition-colors disabled:opacity-50"
            >
              {issuing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Award size={15} />
              )}
              Issue {selected.size > 0 ? selected.size : ""} Certificate{selected.size !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueModal;
