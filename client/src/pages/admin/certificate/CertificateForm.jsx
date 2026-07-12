import React, { useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Loader2, Upload, Printer, ArrowLeft, Save, Award } from "lucide-react";

import {
  useCreateCertificateMutation,
  useUpdateCertificateMutation,
  useGetCertificateByIdQuery,
} from "@/features/api/certificateApi";
import { useGetCreatorCourseQuery } from "@/features/api/courseApi";
import CertificatePreview from "./CertificatePreview";

const CERT_TITLES = [
  "Certificate of Completion",
  "Certificate of Achievement",
  "Certificate of Participation",
  "Certificate of Excellence",
];

const defaultForm = {
  courseId: "",
  organizationName: "Skillera",
  certificateTitle: "Certificate of Completion",
  certificateStatement:
    "This is to certify that the above-named individual has successfully completed the course.",
  courseName: "",
  completionDate: "",
  issueDate: new Date().toISOString().slice(0, 10),
  duration: "",
  grade: "",
  instructorName: "",
  accreditation: "",
  recipientName: "Student Name",
};

const FileInput = ({ label, name, preview, onChange, hint }) => (
  <div>
    <label className="block text-sm font-light text-gray-700 mb-1">{label}</label>
    {hint && <p className="text-xs text-gray-400 font-light mb-1">{hint}</p>}
    <div className="flex items-center gap-3">
      {preview && (
        <img src={preview} alt={label} className="h-10 w-auto object-contain rounded border" />
      )}
      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-dashed border-gray-300 rounded-lg hover:border-amber-400 transition-colors text-sm text-gray-500 hover:text-amber-600">
        <Upload size={14} />
        {preview ? "Replace" : "Upload"} image
        <input type="file" name={name} accept="image/*" onChange={onChange} className="hidden" />
      </label>
    </div>
  </div>
);

const CertificateForm = ({ mode = "create" }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((s) => s.auth);
  const printRef = useRef(null);

  const [form, setForm] = useState(defaultForm);
  const [previews, setPreviews] = useState({});
  const [files, setFiles] = useState({});
  const [loaded, setLoaded] = useState(mode === "create");

  // Queries
  const { data: coursesData } = useGetCreatorCourseQuery();
  const courses = coursesData?.courses || [];

  // Load existing cert if editing
  const { data: certData, isSuccess: isCertLoaded } = useGetCertificateByIdQuery(id, {
    skip: mode === "create" || !id,
  });

  React.useEffect(() => {
    if (isCertLoaded && certData?.certificate) {
      const certificate = certData.certificate;
      setForm({
        courseId: certificate.course?._id || "",
        organizationName: certificate.organizationName || "Skillera",
        certificateTitle: certificate.certificateTitle || "Certificate of Completion",
        certificateStatement: certificate.certificateStatement || "",
        courseName: certificate.courseName || "",
        completionDate: certificate.completionDate
          ? new Date(certificate.completionDate).toISOString().slice(0, 10)
          : "",
        issueDate: certificate.issueDate
          ? new Date(certificate.issueDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        duration: certificate.duration || "",
        grade: certificate.grade || "",
        instructorName: certificate.instructorName || user?.name || "",
        accreditation: certificate.accreditation || "",
        recipientName: certificate.recipientName || "Student Name",
      });
      setPreviews({
        organizationLogo: certificate.organizationLogo,
        authorizedSignature: certificate.authorizedSignature,
        officialSeal: certificate.officialSeal,
      });
      setLoaded(true);
    }
  }, [isCertLoaded, certData, user]);

  const [createCert, { isLoading: creating }] = useCreateCertificateMutation();
  const [updateCert, { isLoading: updating }] = useUpdateCertificateMutation();
  const saving = creating || updating;

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-fill courseName when a course is selected
      if (name === "courseId") {
        const chosen = courses.find((c) => c._id === value);
        if (chosen) next.courseName = chosen.title;
      }
      return next;
    });
  }, [courses]);

  const handleFileChange = useCallback((e) => {
    const { name, files: f } = e.target;
    if (!f?.[0]) return;
    setFiles((prev) => ({ ...prev, [name]: f[0] }));
    setPreviews((prev) => ({ ...prev, [name]: URL.createObjectURL(f[0]) }));
  }, []);

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== "" && v !== undefined) fd.append(k, v); });
    Object.entries(files).forEach(([k, v]) => fd.append(k, v));
    return fd;
  };

  const handleSave = async () => {
    if (!form.courseId) { toast.error("Please select a course."); return; }
    try {
      if (mode === "create") {
        await createCert(buildFormData()).unwrap();
        toast.success("Certificate template created!");
        navigate("/instructor/certificates");
      } else {
        await updateCert({ id, formData: buildFormData() }).unwrap();
        toast.success("Certificate updated!");
        navigate("/instructor/certificates");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save certificate.");
    }
  };

  const handlePrint = () => {
    const el = document.getElementById("certificate-print-area");
    if (!el) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate Preview</title>
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
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
  };

  const previewData = {
    ...form,
    organizationLogo: previews.organizationLogo || "",
    authorizedSignature: previews.authorizedSignature || "",
    officialSeal: previews.officialSeal || "",
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/instructor/certificates")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm font-light"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2 ml-2">
          <Award className="text-amber-500 shrink-0" size={24} />
          <h1 className="text-3xl font-light text-gray-800">
            {mode === "create" ? "Create Certificate Template" : "Edit Certificate Template"}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-light text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer size={15} /> Preview PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-light transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {mode === "create" ? "Create Template" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="flex gap-0 h-[calc(100vh-65px)]">
        {/* ── Left: Form ─────────────────────────────── */}
        <div className="w-[400px] shrink-0 border-r bg-white overflow-y-auto p-6 flex flex-col gap-5">
          {/* Course */}
          <section className="space-y-3">
            <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">Course</h3>
            <div>
              <label className="block text-sm font-light text-gray-700 mb-1">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="courseId"
                value={form.courseId}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white text-slate-800"
              >
                <option value="">Select a course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Organisation */}
          <section className="space-y-3">
            <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">Organisation</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Organisation Name</label>
                <input
                  name="organizationName"
                  value={form.organizationName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white text-slate-800"
                />
              </div>
              <FileInput
                label="Organisation Logo"
                name="organizationLogo"
                preview={previews.organizationLogo}
                onChange={handleFileChange}
                hint="PNG/SVG recommended. Shown at the top."
              />
            </div>
          </section>

          {/* Certificate content */}
          <section className="space-y-3">
            <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">Content</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Certificate Title</label>
                <select
                  name="certificateTitle"
                  value={form.certificateTitle}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white text-slate-805"
                >
                  {CERT_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Recipient Name</label>
                <input
                  name="recipientName"
                  value={form.recipientName}
                  onChange={handleChange}
                  placeholder="e.g. Student Name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white text-slate-808"
                />
              </div>
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Certificate Statement</label>
                <textarea
                  name="certificateStatement"
                  value={form.certificateStatement}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none resize-none bg-white text-slate-807"
                />
              </div>
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Course / Program Name</label>
                <input
                  name="courseName"
                  value={form.courseName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white text-slate-806"
                />
              </div>
            </div>
          </section>

          {/* Dates */}
          <section className="space-y-3">
            <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">Dates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Completion Date</label>
                <input
                  type="date"
                  name="completionDate"
                  value={form.completionDate}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white text-slate-809"
                />
              </div>
              <div>
                <label className="block text-sm font-light text-gray-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  name="issueDate"
                  value={form.issueDate}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white text-slate-810"
                />
              </div>
            </div>
          </section>

          {/* Optional extras */}
          <section className="space-y-3">
            <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">Optional Details</h3>
            <div className="flex flex-col gap-3">
              {[
                { name: "duration", label: "Duration", placeholder: "e.g. 40 Hours, 12 Weeks" },
                { name: "grade", label: "Grade / Score", placeholder: "e.g. A+, 95%" },
                { name: "instructorName", label: "Instructor Name", placeholder: user?.name || "" },
                { name: "accreditation", label: "Accreditation Info", placeholder: "e.g. Accredited by..." },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-light text-gray-700 mb-1">{label}</label>
                  <input
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white text-slate-800"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Visuals */}
          <section className="space-y-3">
            <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">Visual Elements</h3>
            <div className="flex flex-col gap-4">
              <FileInput
                label="Authorized Signature"
                name="authorizedSignature"
                preview={previews.authorizedSignature}
                onChange={handleFileChange}
                hint="PNG with transparent background recommended."
              />
              <FileInput
                label="Official Seal / Stamp"
                name="officialSeal"
                preview={previews.officialSeal}
                onChange={handleFileChange}
                hint="Circular PNG with transparency works best."
              />
            </div>
          </section>
        </div>

        {/* ── Right: Live Preview ───────────────────── */}
        <div className="flex-1 bg-gray-100 overflow-auto flex flex-col items-center justify-start py-10 gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-light uppercase tracking-widest">
            <Award size={12} /> Live Preview
          </div>
          <div className="scale-[0.85] origin-top">
            <CertificatePreview ref={printRef} data={previewData} />
          </div>
          <p className="text-xs font-light text-gray-400 text-center">
            The QR code and Certificate ID will be generated when you issue the certificate to a student.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateForm;
