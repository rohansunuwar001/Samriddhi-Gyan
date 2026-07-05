import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetCertificationBySlugQuery,
  useRegisterMockExamMutation,
  useInitializeExamEsewaMutation,
} from "@/features/api/certificationApi";
import { useGetCourseProgressQuery } from "@/features/api/courseProgressApi";
import { useAddToCartMutation } from "@/features/api/cartApi";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  Lock,
  ChevronRight,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";

const CertificationDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  // Queries
  const { data, isLoading, isError, refetch } = useGetCertificationBySlugQuery(slug);
  const [registerMock, { isLoading: registeringMock }] = useRegisterMockExamMutation();
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

  const cert = data?.certification;
  const courseCompleted = data?.courseCompleted || false;
  const registration = data?.registration; // paymentStatus, examStatus, passed, score, certificateId
  const relatedCourses = data?.relatedCourses || [];
  const checkoutAmount = data?.checkoutAmount || cert?.examPrice || 0;
  const isReapplying = data?.isReapplying || false;
  const attemptNumber = data?.attemptNumber || 1;
  const candidatesCount = data?.candidatesCount || 0;

  const registering = registeringMock || isAddingToCart;

  const handleBuyVoucher = async () => {
    if (!user) {
      toast.error("Please login to register for the exam.");
      return;
    }
    try {
      await addToCart({ certificationId: cert._id }).unwrap();
      toast.success("Exam voucher added to your cart!");
      navigate("/cart");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add exam voucher to cart.");
    }
  };

  const handleStartExam = () => {
    if (!registration || registration.paymentStatus !== "completed") {
      toast.error("Please purchase the exam voucher first.");
      return;
    }
    if (!courseCompleted) {
      toast.error("Please complete the suggested course to unlock the exam.");
      return;
    }
    navigate(`/certification/${slug}/exam/${registration._id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-purple-600" size={36} />
      </div>
    );
  }

  if (isError || !cert) {
    return (
      <div className="text-center py-20 text-slate-400">
        <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
        <p>Certification not found.</p>
      </div>
    );
  }

  const isPurchased = registration?.paymentStatus === "completed";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ─── BANNER HEADER ─── */}
      <div className="bg-[#1c1d1f] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-xs text-purple-400 font-bold uppercase tracking-wider flex-wrap">
              {cert.categoryFilterParent?.name && (
                <>
                  <span>{cert.categoryFilterParent.name}</span>
                  <ChevronRight size={12} />
                </>
              )}
              {cert.categoryFilterChild?.name && (
                <>
                  <span>{cert.categoryFilterChild.name}</span>
                  <ChevronRight size={12} />
                </>
              )}
              <span>{cert.issuer?.name}</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">{cert.name}</h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">
              {cert.description ||
                `Earners of this certification demonstrate a comprehensive understanding of core technical concepts, best practices, and hands-on implementation strategies.`}
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <TrendingUp size={16} className="text-purple-400" />
                {candidatesCount} Candidate{candidatesCount !== 1 ? "s" : ""} Enrolled
              </span>
              <span className="flex items-center gap-1">
                <Award size={16} className="text-purple-400" />
                Verified Credential
              </span>
            </div>
          </div>

          {/* Badge Logo */}
          <div className="shrink-0">
            {cert.badgeUrl ? (
              <img
                src={cert.badgeUrl}
                alt=""
                className="w-44 h-44 object-contain drop-shadow-[0_8px_24px_rgba(168,85,247,0.3)] animate-pulse"
              />
            ) : (
              <div className="w-44 h-44 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white drop-shadow-[0_8px_24px_rgba(168,85,247,0.3)]">
                <Award size={72} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BODY CONTENT ─── */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Get Certified with Top Instructors</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Suggested Prep Path */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 bg-purple-100 text-purple-700 font-bold rounded-full flex items-center justify-center text-sm">
                  1
                </span>
                <h3 className="font-bold text-slate-800 text-base">Recommended Prep Path</h3>
              </div>

              {/* Prep Courses List */}
              {relatedCourses.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No courses found in this category path.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-4">
                  {relatedCourses.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => navigate(`/course-detail/${c._id}`)}
                      className="flex items-center gap-2 p-2 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-purple-50/30 hover:border-purple-100 transition-all cursor-pointer"
                    >
                      <img src={c.thumbnail || "/default-thumbnail.jpg"} alt="" className="w-9 h-9 object-cover rounded-lg border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{c.title}</h4>
                        <p className="text-[10px] text-slate-400">By {c.creator?.name || "Instructor"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Status details */}
              {user ? (
                <div className="p-3 rounded-2xl bg-slate-50 border text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Eligibility Status</p>
                  {courseCompleted ? (
                    <p className="text-green-600 font-semibold flex items-center gap-1">✔ Prep course requirement met!</p>
                  ) : (
                    <p className="text-amber-600 font-semibold flex items-center gap-1">ℹ Complete at least one prep course to qualify.</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Log in to track progress.</p>
              )}
            </div>

            <div className="mt-6">
              {courseCompleted ? (
                <div className="flex items-center gap-1.5 text-green-600 font-semibold text-sm justify-center">
                  <CheckCircle size={18} /> Requirements Met!
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 font-medium py-2">
                  Complete prep course above to unlock
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Practice Exam */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 bg-purple-100 text-purple-700 font-bold rounded-full flex items-center justify-center text-sm">
                  2
                </span>
                <h3 className="font-bold text-slate-800 text-base">Certification Examination</h3>
              </div>

              <p className="text-sm text-slate-500 mb-6">
                Validate your knowledge and earn your badge. Answer questions from key domain subjects under timed conditions.
              </p>

              <div className="space-y-3 text-xs text-slate-500">
                <div className="flex justify-between border-b pb-2">
                  <span className="flex items-center gap-1">
                    <HelpCircle size={14} /> Questions
                  </span>
                  <span className="font-semibold text-slate-700">{cert.questions?.length || 0} Qs</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> Time Allowed
                  </span>
                  <span className="font-semibold text-slate-700">{cert.duration} mins</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="flex items-center gap-1">
                    <Award size={14} /> Passing Grade
                  </span>
                  <span className="font-semibold text-slate-700">{cert.passingScore}% Score</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="flex items-center gap-1">
                    <Award size={14} /> Total / Pass Marks
                  </span>
                  <span className="font-semibold text-slate-700">{cert.totalMarks || 100} / {cert.passMarks || 40} Marks</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="flex items-center gap-1">
                    <Award size={14} /> Exam Grades
                  </span>
                  <span className="font-semibold text-slate-700">{cert.grades || "A, B, C, Pass"}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} /> Certificate Registry Fee
                  </span>
                  <span className="font-semibold text-slate-700">Rs. {cert.certificatePrice || 0}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {registration?.examStatus === "completed" ? (
                registration.passed ? (
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl text-center text-sm font-bold flex flex-col gap-1.5 items-center">
                    <div className="flex items-center gap-1.5">
                      <Award size={18} />
                      Passed with {registration.score}%!
                    </div>
                    <span className="text-[10px] text-green-600 font-mono">ID: {registration.certificateId}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-1.5">
                      <AlertCircle size={18} />
                      Failed with {registration.score}%
                    </div>
                    <button
                      onClick={handleBuyVoucher}
                      disabled={registering}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      {registering ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <>
                          <ShoppingCart size={14} /> Re-apply (Add Voucher to Cart - Rs {checkoutAmount})
                        </>
                      )}
                    </button>
                  </div>
                )
              ) : isPurchased ? (
                courseCompleted ? (
                  <button
                    onClick={handleStartExam}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-md animate-bounce"
                  >
                    Start Certification Exam
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed"
                  >
                    <Lock size={14} /> Finish any Prep Course to Unlock
                  </button>
                )
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed"
                >
                  <Lock size={14} /> Purchase Voucher First
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Voucher Deal */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 bg-purple-100 text-purple-700 font-bold rounded-full flex items-center justify-center text-sm">
                  3
                </span>
                <h3 className="font-bold text-slate-800 text-base">Exam Voucher Deal</h3>
              </div>

              <p className="text-sm text-slate-500 mb-6">
                Register for the final certificate exam. Purchasing the voucher unlocks exam attempts and earns a verified credential badge.
              </p>

              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                    {isReapplying ? "Re-apply Exam Fee" : "Exam Fee"}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-2xl font-extrabold text-slate-800">Rs {checkoutAmount}</p>
                    {isReapplying && (
                      <p className="text-xs text-slate-400 line-through">Rs {cert.examPrice}</p>
                    )}
                  </div>
                  {isReapplying && (
                    <span className="text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                      75% Retry Discount Applied
                    </span>
                  )}
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold">
                  Official Partner
                </span>
              </div>
            </div>

            <div className="mt-6">
              {isPurchased && registration?.examStatus !== "completed" ? (
                <div className="text-center py-2 px-4 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 border border-emerald-100">
                  <CheckCircle size={18} className="text-emerald-600" /> Already Registered for Exam
                </div>
              ) : (
                <button
                  onClick={handleBuyVoucher}
                  disabled={registering}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {registering ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <>
                      <ShoppingCart size={14} /> Add Voucher to Cart
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── OTHER RECOMMENDED COURSES ─── */}
        {relatedCourses.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-bold text-slate-800 mb-6">More Prep Courses for this Certificate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {relatedCourses.map((c) => (
                <div
                  key={c._id}
                  onClick={() => navigate(`/course-detail/${c._id}`)}
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-full"
                >
                  <div>
                    <img src={c.thumbnail || "/default-thumbnail.jpg"} alt="" className="w-full h-36 object-cover" />
                    <div className="p-4 space-y-2">
                      <h4 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug">{c.title}</h4>
                      <p className="text-xs text-slate-400">By {c.creator?.name || "Instructor"}</p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 flex justify-between items-center text-xs border-t mt-auto">
                    <span className="font-bold text-slate-800">Rs {c.price?.current || "Free"}</span>
                    <span className="text-slate-400 font-medium">{c.enrolledStudents?.length || 0} students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TICKET BANNER ─── */}
        <div className="mt-16 bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
          {/* Watermark */}
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Award size={200} />
          </div>

          <div className="space-y-2 relative z-10 text-center md:text-left">
            <h3 className="text-xl font-bold">Get your ticket to certification</h3>
            <p className="text-purple-200 text-sm max-w-xl">
              Don't just prepare for your {cert.name} exam — get your exam voucher deal here and save on certified badges.
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-extrabold text-white">Rs {checkoutAmount}</p>
              {isReapplying && (
                <p className="text-sm text-purple-300 line-through">Rs {cert.examPrice}</p>
              )}
            </div>
          </div>

          <div className="relative z-10">
            {isPurchased && registration?.examStatus !== "completed" ? (
              <span className="px-6 py-3 bg-white text-purple-800 font-extrabold rounded-2xl text-sm shadow-md flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" /> Already Registered for Exam
              </span>
            ) : (
              <button
                onClick={handleBuyVoucher}
                disabled={registering}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-purple-800 font-extrabold rounded-2xl text-sm transition-colors shadow-md flex items-center gap-1.5"
              >
                {registering ? <Loader2 className="animate-spin" size={15} /> : "Add Voucher to Cart"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificationDetail;
