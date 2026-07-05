import React, { useState } from "react";
import { toast } from "sonner";
import {
  useGetIssuersQuery,
  useCreateIssuerMutation,
  useUpdateIssuerMutation,
  useDeleteIssuerMutation,
  useGetCertificationsQuery,
  useCreateCertificationMutation,
  useUpdateCertificationMutation,
  useDeleteCertificationMutation,
  useGetRegistrationsQuery,
} from "@/features/api/certificationApi";
import { useGetAllCoursesBriefQuery } from "@/features/api/courseApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  Users,
  CreditCard,
  BookOpen,
  PlusCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";

const AdminCertifications = () => {
  const [activeTab, setActiveTab] = useState("issuers");

  // RTK Queries & Mutations
  const { data: issuersData, isLoading: loadingIssuers } = useGetIssuersQuery();
  const { data: certsData, isLoading: loadingCerts } = useGetCertificationsQuery();
  const { data: regsData, isLoading: loadingRegs } = useGetRegistrationsQuery();
  const { data: coursesData } = useGetAllCoursesBriefQuery();
  const { data: categoryData } = useGetAllCategoriesQuery();

  const [createIssuer] = useCreateIssuerMutation();
  const [updateIssuer] = useUpdateIssuerMutation();
  const [deleteIssuer] = useDeleteIssuerMutation();

  const [createCert] = useCreateCertificationMutation();
  const [updateCert] = useUpdateCertificationMutation();
  const [deleteCert] = useDeleteCertificationMutation();

  const issuers = issuersData?.issuers || [];
  const certifications = certsData?.certifications || [];
  const registrations = regsData?.registrations || [];
  const courses = coursesData?.courses || [];
  const categories = categoryData?.categories || [];

  // Modals / Form States
  const [issuerModal, setIssuerModal] = useState({ open: false, mode: "create", id: null, name: "", type: "issuer", description: "" });
  const [certModal, setCertModal] = useState({
    open: false,
    mode: "create",
    id: null,
    name: "",
    issuer: "",
    badgeUrl: "",
    badgeImageFile: null,
    description: "",
    categoryFilterParent: "",
    categoryFilterChild: "",
    categoryFilterSubChild: "",
    examPrice: 0,
    certificatePrice: 0,
    passingScore: 70,
    totalMarks: 100,
    passMarks: 40,
    grades: "A, B, C, Pass",
    duration: 90,
    questions: [],
  });

  // Question Tab States
  const [selectedQuestionsCertId, setSelectedQuestionsCertId] = useState("");
  const [questionModal, setQuestionModal] = useState({
    open: false,
    mode: "add",
    index: null,
    questionText: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
  });

  const parentCategories = React.useMemo(() => {
    return categories.filter((c) => !c.parent);
  }, [categories]);

  const childCategories = React.useMemo(() => {
    const pId = certModal.categoryFilterParent;
    if (!pId) return [];
    return categories.filter((c) => c.parent?._id === pId || c.parent === pId);
  }, [categories, certModal.categoryFilterParent]);

  const subChildCategories = React.useMemo(() => {
    const cId = certModal.categoryFilterChild;
    if (!cId) return [];
    return categories.filter((c) => c.parent?._id === cId || c.parent === cId);
  }, [categories, certModal.categoryFilterChild]);

  // ── Issuer Actions ──
  const handleSaveIssuer = async () => {
    if (!issuerModal.name) return toast.error("Name is required");
    try {
      if (issuerModal.mode === "create") {
        await createIssuer({ name: issuerModal.name, type: issuerModal.type, description: issuerModal.description }).unwrap();
        toast.success("Parent Category created successfully!");
      } else {
        await updateIssuer({ id: issuerModal.id, name: issuerModal.name, type: issuerModal.type, description: issuerModal.description }).unwrap();
        toast.success("Parent Category updated!");
      }
      setIssuerModal({ open: false, name: "", type: "issuer", description: "" });
    } catch (err) {
      toast.error(err?.data?.message || "Error saving Parent Category");
    }
  };

  const handleDeleteIssuer = async (id) => {
    if (!window.confirm("Are you sure? This will delete this category.")) return;
    try {
      await deleteIssuer(id).unwrap();
      toast.success("Deleted successfully.");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete.");
    }
  };

  // ── Certification Actions ──
  const handleOpenCreateModal = () => {
    setCertModal({
      open: true,
      mode: "create",
      id: null,
      name: "",
      issuer: issuers[0]?._id || "",
      badgeUrl: "",
      badgeImageFile: null,
      description: "",
      categoryFilterParent: "",
      categoryFilterChild: "",
      categoryFilterSubChild: "",
      examPrice: 1000,
      certificatePrice: 0,
      passingScore: 70,
      totalMarks: 100,
      passMarks: 40,
      grades: "A, B, C, Pass",
      duration: 90,
      questions: [],
    });
  };

  const handleOpenEditModal = (item) => {
    const parentId = item.categoryFilterParent?._id || item.categoryFilterParent || "";
    const childId = item.categoryFilterChild?._id || item.categoryFilterChild || "";
    const subChildId = item.categoryFilterSubChild?._id || item.categoryFilterSubChild || "";

    setCertModal({
      open: true,
      mode: "edit",
      id: item._id,
      name: item.name,
      issuer: item.issuer?._id || item.issuer || "",
      badgeUrl: item.badgeUrl,
      badgeImageFile: null,
      description: item.description || "",
      categoryFilterParent: parentId,
      categoryFilterChild: childId,
      categoryFilterSubChild: subChildId,
      examPrice: item.examPrice || 0,
      certificatePrice: item.certificatePrice || 0,
      passingScore: item.passingScore || 70,
      totalMarks: item.totalMarks || 100,
      passMarks: item.passMarks || 40,
      grades: item.grades || "A, B, C, Pass",
      duration: item.duration || 90,
      questions: item.questions || [],
    });
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestionsCertId) return toast.error("Please select a certification first.");
    if (!questionModal.questionText) return toast.error("Question text is required");
    if (questionModal.options.some((o) => !o.trim())) return toast.error("All 4 options must be filled.");

    const targetCert = certifications.find((c) => c._id === selectedQuestionsCertId);
    if (!targetCert) return toast.error("Certification not found.");

    let updatedQuestions = [...(targetCert.questions || [])];

    const newQ = {
      questionText: questionModal.questionText,
      options: questionModal.options,
      correctOptionIndex: Number(questionModal.correctOptionIndex),
    };

    if (questionModal.mode === "add") {
      updatedQuestions.push(newQ);
    } else {
      updatedQuestions[questionModal.index] = newQ;
    }

    const formData = new FormData();
    formData.append("name", targetCert.name);
    formData.append("issuer", targetCert.issuer?._id || targetCert.issuer || "");
    formData.append("badgeUrl", targetCert.badgeUrl || "");
    formData.append("description", targetCert.description || "");
    formData.append("categoryFilterParent", targetCert.categoryFilterParent?._id || targetCert.categoryFilterParent || "");
    formData.append("categoryFilterChild", targetCert.categoryFilterChild?._id || targetCert.categoryFilterChild || "");
    formData.append("categoryFilterSubChild", targetCert.categoryFilterSubChild?._id || targetCert.categoryFilterSubChild || "");
    formData.append("examPrice", targetCert.examPrice || 0);
    formData.append("certificatePrice", targetCert.certificatePrice || 0);
    formData.append("passingScore", targetCert.passingScore || 70);
    formData.append("totalMarks", targetCert.totalMarks || 100);
    formData.append("passMarks", targetCert.passMarks || 40);
    formData.append("grades", targetCert.grades || "A, B, C, Pass");
    formData.append("duration", targetCert.duration || 90);
    formData.append("questions", JSON.stringify(updatedQuestions));

    try {
      await updateCert({ id: targetCert._id, formData }).unwrap();
      toast.success(questionModal.mode === "add" ? "Question added!" : "Question updated!");
      setQuestionModal({ open: false, mode: "add", index: null, questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save question.");
    }
  };

  const handleDeleteQuestion = async (idx) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    const targetCert = certifications.find((c) => c._id === selectedQuestionsCertId);
    if (!targetCert) return;

    const updatedQuestions = targetCert.questions.filter((_, i) => i !== idx);

    const formData = new FormData();
    formData.append("name", targetCert.name);
    formData.append("issuer", targetCert.issuer?._id || targetCert.issuer || "");
    formData.append("badgeUrl", targetCert.badgeUrl || "");
    formData.append("description", targetCert.description || "");
    formData.append("categoryFilterParent", targetCert.categoryFilterParent?._id || targetCert.categoryFilterParent || "");
    formData.append("categoryFilterChild", targetCert.categoryFilterChild?._id || targetCert.categoryFilterChild || "");
    formData.append("categoryFilterSubChild", targetCert.categoryFilterSubChild?._id || targetCert.categoryFilterSubChild || "");
    formData.append("examPrice", targetCert.examPrice || 0);
    formData.append("certificatePrice", targetCert.certificatePrice || 0);
    formData.append("passingScore", targetCert.passingScore || 70);
    formData.append("totalMarks", targetCert.totalMarks || 100);
    formData.append("passMarks", targetCert.passMarks || 40);
    formData.append("grades", targetCert.grades || "A, B, C, Pass");
    formData.append("duration", targetCert.duration || 90);
    formData.append("questions", JSON.stringify(updatedQuestions));

    try {
      await updateCert({ id: targetCert._id, formData }).unwrap();
      toast.success("Question deleted.");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete question.");
    }
  };

  const handleSaveCert = async () => {
    if (!certModal.name || !certModal.issuer || !certModal.categoryFilterParent) {
      return toast.error("Please fill Name, Parent Category, and Course Parent Category.");
    }

    const formData = new FormData();
    formData.append("name", certModal.name);
    formData.append("issuer", certModal.issuer);
    formData.append("badgeUrl", certModal.badgeUrl || "");
    formData.append("description", certModal.description || "");
    formData.append("categoryFilterParent", certModal.categoryFilterParent);
    formData.append("categoryFilterChild", certModal.categoryFilterChild);
    formData.append("categoryFilterSubChild", certModal.categoryFilterSubChild);
    formData.append("examPrice", certModal.examPrice);
    formData.append("certificatePrice", certModal.certificatePrice);
    formData.append("passingScore", certModal.passingScore);
    formData.append("totalMarks", certModal.totalMarks);
    formData.append("passMarks", certModal.passMarks);
    formData.append("grades", certModal.grades);
    formData.append("duration", certModal.duration);
    formData.append("questions", JSON.stringify(certModal.questions || []));

    if (certModal.badgeImageFile) {
      formData.append("badgeImage", certModal.badgeImageFile);
    }

    try {
      if (certModal.mode === "create") {
        await createCert(formData).unwrap();
        toast.success("Certification Child Category created!");
      } else {
        await updateCert({ id: certModal.id, formData }).unwrap();
        toast.success("Certification updated successfully!");
      }
      setCertModal({
        open: false,
        mode: "create",
        id: null,
        name: "",
        issuer: "",
        badgeUrl: "",
        badgeImageFile: null,
        description: "",
        categoryFilterParent: "",
        categoryFilterChild: "",
        categoryFilterSubChild: "",
        examPrice: 0,
        certificatePrice: 0,
        passingScore: 70,
        totalMarks: 100,
        passMarks: 40,
        grades: "A, B, C, Pass",
        duration: 90,
        questions: [],
      });
    } catch (err) {
      toast.error(err?.data?.message || "Error saving Certification");
    }
  };

  const handleDeleteCert = async (id) => {
    if (!window.confirm("Delete this certification category?")) return;
    try {
      await deleteCert(id).unwrap();
      toast.success("Deleted successfully.");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
          <Award size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Certifications & Exam CRUD</h1>
          <p className="text-sm text-slate-500 mt-1">Manage certification categories, mock exams, and exam tickets.</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 mb-6 gap-6 overflow-x-auto">
        {[
          { id: "issuers", label: "Parent Categories (Issuers)", count: issuers.length },
          { id: "certs", label: "Child Certifications", count: certifications.length },
          { id: "questions", label: "Exam Questions", count: certifications.reduce((acc, c) => acc + (c.questions?.length || 0), 0) },
          { id: "regs", label: "Exam Registrations", count: registrations.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all shrink-0 ${
              activeTab === t.id
                ? "border-b-2 border-purple-600 text-purple-600 font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label} <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 rounded-full font-normal">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ─── TAB 1: Parent Issuers ─── */}
      {activeTab === "issuers" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Certification Issuers / Subjects</h2>
            <button
              onClick={() => setIssuerModal({ open: true, mode: "create", id: null, name: "", type: "issuer", description: "" })}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold tracking-wide transition-colors"
            >
              <Plus size={14} /> Add Category
            </button>
          </div>

          {loadingIssuers ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={32} /></div>
          ) : issuers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No categories found. Click Add to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-slate-600">
                  {issuers.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-3 capitalize">
                        <span className="px-2 py-0.5 text-xs bg-slate-100 rounded-full font-medium">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 truncate max-w-xs">{item.description || "—"}</td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => setIssuerModal({ open: true, mode: "edit", id: item._id, name: item.name, type: item.type, description: item.description })}
                          className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteIssuer(item._id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: Child Certifications ─── */}
      {activeTab === "certs" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Available Certifications</h2>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold tracking-wide transition-colors"
            >
              <Plus size={14} /> Add Certification
            </button>
          </div>

          {loadingCerts ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={32} /></div>
          ) : certifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No certifications found. Create one to populate the Get Certified dropdown.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Badge</th>
                    <th className="pb-3">Certification</th>
                    <th className="pb-3">Parent Category</th>
                    <th className="pb-3">Course Category</th>
                    <th className="pb-3">Exam Price</th>
                    <th className="pb-3">Questions</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-slate-600">
                  {certifications.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50">
                      <td className="py-3">
                        {item.badgeUrl ? (
                           <img src={item.badgeUrl} alt="" className="w-10 h-10 object-contain rounded-lg border bg-slate-50" />
                        ) : (
                          <div className="w-10 h-10 bg-purple-50 text-purple-600 flex items-center justify-center rounded-lg font-bold"><Award size={18} /></div>
                        )}
                      </td>
                      <td className="py-3">
                        <p className="font-semibold text-slate-800 leading-tight">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">slug: {item.slug}</p>
                      </td>
                      <td className="py-3 text-slate-700 font-medium">{item.issuer?.name}</td>
                      <td className="py-3 text-slate-500 truncate max-w-xs">
                        {item.categoryFilterSubChild?.name || item.categoryFilterChild?.name || item.categoryFilterParent?.name || "All"}
                      </td>
                      <td className="py-3 font-semibold text-emerald-600">Rs {item.examPrice}</td>
                      <td className="py-3 text-slate-400 font-medium">{item.questions?.length || 0} Qs</td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCert(item._id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: Exam Registrations ─── */}
      {activeTab === "regs" && (() => {
        // Group registrations by certification._id
        const grouped = registrations.reduce((acc, item) => {
          const certId = item.certification?._id || "unknown";
          if (!acc[certId]) acc[certId] = { cert: item.certification, items: [] };
          acc[certId].items.push(item);
          return acc;
        }, {});
        const groups = Object.values(grouped);

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Exam Registrations by Certification</h2>
                <p className="text-xs text-slate-400 mt-0.5">Registrations grouped by certification category.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-full">
                  {registrations.length} Total Students
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                  {groups.length} Certifications
                </span>
              </div>
            </div>

            {loadingRegs ? (
              <div className="flex justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Loader2 className="animate-spin text-purple-600" size={32} />
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                No student exam registration records found.
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.cert?._id || "unknown"} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Certification Group Header */}
                  <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                    {group.cert?.badgeUrl ? (
                      <img src={group.cert.badgeUrl} alt="" className="w-12 h-12 object-contain rounded-xl border border-purple-100 bg-white p-1 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center rounded-xl shrink-0">
                        <Award size={22} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-800 text-base leading-tight truncate">
                        {group.cert?.name || "Unknown Certification"}
                      </h3>
                      {group.cert?.slug && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">slug: {group.cert.slug}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="px-3 py-1 bg-white text-purple-700 border border-purple-200 text-xs font-bold rounded-full flex items-center gap-1.5">
                        <Users size={12} />
                        {group.items.length} Registered
                      </span>
                      <span className="px-3 py-1 bg-white text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                        {group.items.filter(i => i.paymentStatus === "completed").length} Paid
                      </span>
                      {group.items.some(i => i.examStatus === "completed" && i.passed) && (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold rounded-full">
                          {group.items.filter(i => i.examStatus === "completed" && i.passed).length} Passed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Students Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[780px]">
                      <thead>
                        <tr className="border-b border-gray-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/60">
                          <th className="py-2.5 px-6">Student</th>
                          <th className="py-2.5 px-4">Registered On</th>
                          <th className="py-2.5 px-4">Attempt #</th>
                          <th className="py-2.5 px-4">Payment</th>
                          <th className="py-2.5 px-4">Paid Amount</th>
                          <th className="py-2.5 px-4">Method</th>
                          <th className="py-2.5 px-4">Transaction ID</th>
                          <th className="py-2.5 px-4">Exam Status</th>
                          <th className="py-2.5 px-4">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-sm text-slate-600">
                        {group.items.map((item) => (
                          <tr key={item._id} className="hover:bg-purple-50/20 transition-colors align-top">
                            {/* Student */}
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-2.5">
                                {item.student?.photoUrl ? (
                                  <img src={item.student.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-purple-100 shrink-0" />
                                ) : (
                                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm rounded-full shrink-0">
                                    {item.student?.name?.[0]?.toUpperCase() || "?"}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 leading-tight">{item.student?.name || "—"}</p>
                                  <p className="text-[10px] text-slate-400">{item.student?.email || "—"}</p>
                                </div>
                              </div>
                            </td>
                            {/* Registered On */}
                            <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                                : "—"}
                              <br />
                              <span className="text-[10px] text-slate-400">
                                {item.createdAt ? new Date(item.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                              </span>
                            </td>
                            {/* Attempt # */}
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-bold">#{item.attemptNumber || 1}</span>
                            </td>
                            {/* Payment Status */}
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                                item.paymentStatus === "completed"
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                              }`}>
                                {item.paymentStatus}
                              </span>
                            </td>
                            {/* Paid Amount */}
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              Rs. {(item.amountPaid || 0).toLocaleString()}
                            </td>
                            {/* Method */}
                            <td className="py-3.5 px-4 capitalize font-medium text-slate-600 text-xs">
                              {item.paymentMethod || "eSewa"}
                            </td>
                            {/* Transaction ID */}
                            <td className="py-3.5 px-4">
                              <span className="text-[10px] font-mono text-slate-400 break-all max-w-[90px] block">
                                {item.transactionId || "—"}
                              </span>
                            </td>
                            {/* Exam Status */}
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                                item.examStatus === "completed"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : item.examStatus === "started"
                                  ? "bg-orange-50 text-orange-700 border border-orange-100"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {item.examStatus}
                              </span>
                            </td>
                            {/* Result */}
                            <td className="py-3.5 px-4">
                              {item.examStatus === "completed" ? (
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                    item.passed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                                  }`}>
                                    {item.passed ? "✓ PASSED" : "✗ FAILED"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.score ?? 0}% score</span>
                                  {item.certificateId && (
                                    <span className="text-[9px] font-mono text-purple-500 break-all">{item.certificateId}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })()}

      {/* ─── TAB 4: Exam Questions Tab ─── */}
      {activeTab === "questions" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800">Exam Questions Manager</h2>
              <p className="text-xs text-slate-400">Select a certification to manage its multiple choice exam questions.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedQuestionsCertId}
                onChange={(e) => setSelectedQuestionsCertId(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none cursor-pointer"
              >
                <option value="">Select Certification...</option>
                {certifications.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>

              {selectedQuestionsCertId && (
                <button
                  onClick={() =>
                    setQuestionModal({
                      open: true,
                      mode: "add",
                      index: null,
                      questionText: "",
                      options: ["", "", "", ""],
                      correctOptionIndex: 0,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold tracking-wide transition-colors shrink-0"
                >
                  <Plus size={14} /> Add Question
                </button>
              )}
            </div>
          </div>

          {!selectedQuestionsCertId ? (
            <div className="text-center py-16 text-slate-400 font-medium">
              Please select a certification from the dropdown above to manage its exam questions.
            </div>
          ) : (() => {
            const selectedCert = certifications.find((c) => c._id === selectedQuestionsCertId);
            if (!selectedCert) return null;
            const certQuestions = selectedCert.questions || [];

            if (certQuestions.length === 0) {
              return (
                <div className="text-center py-16 text-slate-400">
                  <p className="font-semibold text-slate-500 mb-1">No questions created yet</p>
                  <p className="text-xs max-w-sm mx-auto mb-4">You can add multiple choice questions here to compile the mock exam for {selectedCert.name}.</p>
                  <button
                    onClick={() =>
                      setQuestionModal({
                        open: true,
                        mode: "add",
                        index: null,
                        questionText: "",
                        options: ["", "", "", ""],
                        correctOptionIndex: 0,
                      })
                    }
                    className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Add Your First Question
                  </button>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 w-12 text-center">#</th>
                      <th className="pb-3 max-w-xs">Question text</th>
                      <th className="pb-3">Options</th>
                      <th className="pb-3 w-36 text-center">Correct option</th>
                      <th className="pb-3 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm text-slate-600">
                    {certQuestions.map((q, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-4 font-semibold text-slate-800 leading-snug">{q.questionText}</td>
                        <td className="py-4">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 max-w-md">
                            {q.options?.map((o, optionIdx) => (
                              <div
                                key={optionIdx}
                                className={`flex items-center gap-1.5 py-0.5 px-2 rounded-lg ${
                                  optionIdx === q.correctOptionIndex
                                    ? "bg-green-50 text-green-700 font-bold border border-green-200"
                                    : ""
                                }`}
                              >
                                <span className="font-bold opacity-60">{String.fromCharCode(65 + optionIdx)}.</span>
                                <span className="truncate">{o}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold text-xs">
                            Option {q.correctOptionIndex + 1} ({String.fromCharCode(65 + q.correctOptionIndex)})
                          </span>
                        </td>
                        <td className="py-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              setQuestionModal({
                                open: true,
                                mode: "edit",
                                index: idx,
                                questionText: q.questionText,
                                options: [...(q.options || [])],
                                correctOptionIndex: q.correctOptionIndex,
                              })
                            }
                            className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(idx)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
      {issuerModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">
              {issuerModal.mode === "create" ? "Add Parent Category / Issuer" : "Edit Parent Category"}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={issuerModal.name}
                  onChange={(e) => setIssuerModal({ ...issuerModal, name: e.target.value })}
                  placeholder="e.g. Amazon Web Services (AWS) Certifications"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Type</label>
                <select
                  value={issuerModal.type}
                  onChange={(e) => setIssuerModal({ ...issuerModal, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                >
                  <option value="issuer">Issuer (e.g. Amazon, Cisco)</option>
                  <option value="subject">Subject (e.g. Cloud Certification)</option>
                  <option value="voucher">Voucher Deal Section</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea
                  value={issuerModal.description}
                  onChange={(e) => setIssuerModal({ ...issuerModal, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIssuerModal({ open: false })}
                className="px-4 py-2 rounded-xl border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveIssuer}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold tracking-wide transition-colors"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Child Certification Form ─── */}
      {certModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-purple-600" />
                <h3 className="font-bold text-slate-800 text-lg">
                  {certModal.mode === "create" ? "Add Certification" : "Edit Certification"}
                </h3>
              </div>
              <button
                onClick={() =>
                  setCertModal({
                    open: false,
                    mode: "create",
                    id: null,
                    name: "",
                    issuer: "",
                    badgeUrl: "",
                    badgeImageFile: null,
                    description: "",
                    suggestedCourse: "",
                    examPrice: 0,
                    passingScore: 70,
                    duration: 90,
                    questions: [],
                  })
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="font-bold text-slate-700 text-sm border-b pb-1">Certification Details</h4>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={certModal.name}
                  onChange={(e) => setCertModal({ ...certModal, name: e.target.value })}
                  placeholder="e.g. AWS Certified Developer - Associate"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Parent Category</label>
                <select
                  value={certModal.issuer}
                  onChange={(e) => setCertModal({ ...certModal, issuer: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none cursor-pointer"
                >
                  <option value="">Select Parent...</option>
                  {issuers.map((iss) => (
                    <option key={iss._id} value={iss._id}>{iss.name}</option>
                  ))}
                </select>
              </div>

              {/* Badge Image Uploader */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Badge Image</label>
                <div className="flex items-center gap-3">
                  {certModal.badgeUrl && !certModal.badgeImageFile && (
                    <img src={certModal.badgeUrl} alt="Badge Preview" className="w-10 h-10 object-contain rounded border" />
                  )}
                  {certModal.badgeImageFile && (
                    <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded border flex items-center justify-center font-bold text-xs">
                      New
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCertModal({ ...certModal, badgeImageFile: e.target.files[0] });
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Course Category Tree Linkage (Deploy from Start) */}
              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prep Course Category Linkage</span>
                  <span className="text-[9px] text-slate-400">All courses in the chosen category path will be automatically suggested for student preparation.</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Parent Category</label>
                    <select
                      value={certModal.categoryFilterParent}
                      onChange={(e) => {
                        setCertModal({
                          ...certModal,
                          categoryFilterParent: e.target.value,
                          categoryFilterChild: "",
                          categoryFilterSubChild: "",
                        });
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-purple-400 focus:border-transparent outline-none cursor-pointer"
                    >
                      <option value="">Select Category...</option>
                      {parentCategories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Child Category</label>
                    <select
                      value={certModal.categoryFilterChild}
                      onChange={(e) => {
                        setCertModal({
                          ...certModal,
                          categoryFilterChild: e.target.value,
                          categoryFilterSubChild: "",
                        });
                      }}
                      disabled={!certModal.categoryFilterParent}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-purple-400 focus:border-transparent outline-none disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                    >
                      <option value="">All Children</option>
                      {childCategories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Sub Child Category</label>
                    <select
                      value={certModal.categoryFilterSubChild}
                      onChange={(e) => {
                        setCertModal({
                          ...certModal,
                          categoryFilterSubChild: e.target.value,
                        });
                      }}
                      disabled={!certModal.categoryFilterChild}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-purple-400 focus:border-transparent outline-none disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                    >
                      <option value="">All Sub-Children</option>
                      {subChildCategories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Exam Price</label>
                  <input
                    type="number"
                    value={certModal.examPrice}
                    onChange={(e) => setCertModal({ ...certModal, examPrice: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Certificate Price</label>
                  <input
                    type="number"
                    value={certModal.certificatePrice}
                    onChange={(e) => setCertModal({ ...certModal, certificatePrice: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Duration (m)</label>
                  <input
                    type="number"
                    value={certModal.duration}
                    onChange={(e) => setCertModal({ ...certModal, duration: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={certModal.totalMarks}
                    onChange={(e) => setCertModal({ ...certModal, totalMarks: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={certModal.passMarks}
                    onChange={(e) => setCertModal({ ...certModal, passMarks: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Passing score (%)</label>
                  <input
                    type="number"
                    value={certModal.passingScore}
                    onChange={(e) => setCertModal({ ...certModal, passingScore: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Grades</label>
                  <input
                    type="text"
                    value={certModal.grades}
                    onChange={(e) => setCertModal({ ...certModal, grades: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea
                  value={certModal.description}
                  onChange={(e) => setCertModal({ ...certModal, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() =>
                  setCertModal({
                    open: false,
                    mode: "create",
                    id: null,
                    name: "",
                    issuer: "",
                    badgeUrl: "",
                    badgeImageFile: null,
                    description: "",
                    categoryFilterParent: "",
                    categoryFilterChild: "",
                    categoryFilterSubChild: "",
                    examPrice: 0,
                    certificatePrice: 0,
                    passingScore: 70,
                    totalMarks: 100,
                    passMarks: 40,
                    grades: "A, B, C, Pass",
                    duration: 90,
                    questions: [],
                  })
                }
                className="px-4 py-2 rounded-xl border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCert}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold tracking-wide transition-colors"
              >
                Save Certification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Question Creator/Editor Dialog (for Tab 4 separate table) ─── */}
      {questionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="text-purple-600" />
                <h3 className="font-bold text-slate-800 text-lg">
                  {questionModal.mode === "add" ? "Add Exam Question" : "Edit Exam Question"}
                </h3>
              </div>
              <button
                onClick={() =>
                  setQuestionModal((prev) => ({ ...prev, open: false }))
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Question Text
                </label>
                <textarea
                  placeholder="Enter the question text..."
                  value={questionModal.questionText}
                  onChange={(e) =>
                    setQuestionModal((prev) => ({
                      ...prev,
                      questionText: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Multiple Choice Options
                </label>
                {questionModal.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 font-bold text-slate-400 text-sm">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const nextOpts = [...questionModal.options];
                        nextOpts[idx] = e.target.value;
                        setQuestionModal((prev) => ({
                          ...prev,
                          options: nextOpts,
                        }))
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Correct Answer
                </label>
                <select
                  value={questionModal.correctOptionIndex}
                  onChange={(e) =>
                    setQuestionModal((prev) => ({
                      ...prev,
                      correctOptionIndex: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none cursor-pointer"
                >
                  <option value={0}>Option 1 (A)</option>
                  <option value={1}>Option 2 (B)</option>
                  <option value={2}>Option 3 (C)</option>
                  <option value={3}>Option 4 (D)</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() =>
                  setQuestionModal((prev) => ({ ...prev, open: false }))
                }
                className="px-4 py-2 rounded-xl border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold tracking-wide transition-colors"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCertifications;
