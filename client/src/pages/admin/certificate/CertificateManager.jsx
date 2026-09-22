import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Send,
  Eye,
  Loader2,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

import {
  useGetMyCertificatesQuery,
  useDeleteCertificateMutation,
} from "@/features/api/certificateApi";
import CertificatePreview from "./CertificatePreview";
import IssueModal from "./IssueModal";

const EmptyState = ({ onNew }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
      <Award size={40} className="text-amber-400" />
    </div>
    <div className="text-center">
      <h3 className="text-3xl font-extralight text-gray-700">No certificate templates yet</h3>
      <p className="text-gray-400 text-base font-extralight mt-1 max-w-xs">
        Create a reusable template and issue certificates to your enrolled students.
      </p>
    </div>
    <button
      onClick={onNew}
      className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-extralight text-base transition-colors"
    >
      <Plus size={16} /> Create First Certificate
    </button>
  </div>
);

const CertificateManager = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetMyCertificatesQuery();
  const [deleteCert, { isLoading: deleting }] = useDeleteCertificateMutation();

  const [issueModalId, setIssueModalId] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const printRef = useRef(null);

  const certificates = data?.certificates || [];

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete certificate template for "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteCert(id).unwrap();
      toast.success("Certificate template deleted.");
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrint = (cert) => {
    setPreviewCert(cert);
    setTimeout(() => {
      const el = document.getElementById("certificate-print-area");
      if (!el) return;
      const pw = window.open("", "_blank");
      pw.document.write(`
        <html>
          <head>
            <title>${cert.courseName} - Certificate</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              @page { size: A4 landscape; margin: 0; }
              html, body {
                margin: 0;
                padding: 0;
                width: 297mm;
                height: 210mm;
                overflow: hidden;
                background: #fff;
              }
              #certificate-print-area {
                width: 297mm !important;
                height: 210mm !important;
                margin: 0 !important;
                padding: 20mm !important;
                box-shadow: none !important;
                border: none !important;
                box-sizing: border-box !important;
              }
              * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            </style>
            <link rel="stylesheet" href="/src/index.css">
          </head>
          <body>${el.outerHTML}</body>
        </html>
      `);
      pw.document.close();
      setTimeout(() => { pw.print(); pw.close(); setPreviewCert(null); }, 600);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Failed to load certificates. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <Award className="text-amber-600 shrink-0" size={24} />
          </div>
          <div>
            <h1 className="text-5xl font-extralight text-gray-800">Certificate Manager</h1>
            <p className="text-lg font-extralight text-gray-500 mt-1">
              Create templates and issue certificates to your students
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/instructor/certificates/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-extralight text-base transition-colors shadow-sm"
        >
          <Plus size={16} /> New Certificate
        </button>
      </div>

      {/* Stats row */}
      {certificates.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Templates",
              value: certificates.length,
              icon: <Award size={18} className="text-amber-500" />,
              bg: "bg-amber-50 border-amber-100",
            },
            {
              label: "Total Issued",
              value: certificates.reduce((a, c) => a + (c.issuedCount || 0), 0),
              icon: <CheckCircle2 size={18} className="text-green-500" />,
              bg: "bg-green-50 border-green-100",
            },
            {
              label: "Courses Covered",
              value: new Set(certificates.map((c) => c.course?._id)).size,
              icon: <BookOpen size={18} className="text-blue-500" />,
              bg: "bg-blue-50 border-blue-100",
            },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className={`${bg} border rounded-2xl p-4 flex items-center gap-4`}>
              <div className="p-2.5 bg-white rounded-xl shadow-sm">{icon}</div>
              <div>
                <p className="text-3xl font-extralight text-gray-800">{value}</p>
                <p className="text-sm text-gray-500 font-extralight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {certificates.length === 0 ? (
        <EmptyState onNew={() => navigate("/instructor/certificates/new")} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {/* Thumbnail strip */}
              <div className="h-24 bg-gradient-to-br from-amber-500 to-yellow-400 relative flex items-center justify-center overflow-hidden">
                {cert.course?.thumbnail ? (
                  <img
                    src={cert.course.thumbnail}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                ) : null}
                <div className="relative z-10 flex flex-col items-center text-white">
                  <Award size={28} />
                  <p className="text-sm font-extralight mt-1 opacity-90">{cert.certificateTitle}</p>
                </div>
                {/* Issued badge */}
                {cert.issuedCount > 0 && (
                  <div className="absolute top-2 right-2 bg-white/90 text-amber-700 text-sm font-extralight px-2 py-0.5 rounded-full">
                    {cert.issuedCount} issued
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div>
                  <h3 className="font-extralight text-gray-800 text-base leading-tight truncate">
                    {cert.courseName || cert.course?.title}
                  </h3>
                  <p className="text-sm font-extralight text-gray-400 mt-0.5">{cert.course?.category}</p>
                </div>

                <div className="text-sm text-gray-500 font-extralight space-y-0.5">
                  <div className="flex justify-between">
                    <span>Organisation</span>
                    <span className="font-extralight text-gray-700 truncate max-w-[140px]">
                      {cert.organizationName}
                    </span>
                  </div>
                  {cert.duration && (
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span className="font-extralight text-gray-700">{cert.duration}</span>
                    </div>
                  )}
                  {cert.instructorName && (
                    <div className="flex justify-between">
                      <span>Instructor</span>
                      <span className="font-extralight text-gray-700 truncate max-w-[140px]">
                        {cert.instructorName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-50 p-3 flex items-center gap-2">
                <button
                  onClick={() => setIssueModalId(cert._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-extralight transition-colors"
                >
                  <Send size={13} /> Issue
                </button>
                <button
                  onClick={() => handlePrint(cert)}
                  className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  title="Preview PDF"
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => navigate(`/instructor/certificates/${cert._id}/edit`)}
                  className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(cert._id, cert.courseName || cert.course?.title)}
                  disabled={deleting && deletingId === cert._id}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deleting && deletingId === cert._id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden preview for print */}
      {previewCert && (
        <div className="fixed -top-[9999px] -left-[9999px]">
          <CertificatePreview ref={printRef} data={previewCert} />
        </div>
      )}

      {/* Issue modal */}
      {issueModalId && (
        <IssueModal
          templateId={issueModalId}
          onClose={() => setIssueModalId(null)}
        />
      )}
    </div>
  );
};

export default CertificateManager;
