import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubmitExamMutation } from "@/features/api/certificationApi";
import { useGetCertificateByIdQuery } from "@/features/api/certificateApi";
import { Loader2, Award, Clock, AlertTriangle, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useGetCertificationBySlugQuery } from "@/features/api/certificationApi";

const ExamEnvironment = () => {
  const { slug, regId } = useParams();
  const navigate = useNavigate();

  // Queries
  const { data: certData, isLoading: loadingCert } = useGetCertificationBySlugQuery(slug);
  const [submitExam, { isLoading: submitting }] = useSubmitExamMutation();

  const cert = certData?.certification;
  const questions = cert?.questions || [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examState, setExamState] = useState("intro"); // intro, active, finished
  const [results, setResults] = useState(null); // score, passed, certificateId

  // Set up timer once exam starts
  useEffect(() => {
    if (examState === "active" && cert?.duration) {
      setTimeLeft(cert.duration * 60);
    }
  }, [examState, cert]);

  // Countdown countdown
  useEffect(() => {
    if (examState !== "active" || timeLeft <= 0) {
      if (timeLeft === 0 && examState === "active") {
        handleSubmit();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, examState]);

  const handleSelectOption = (optIdx) => {
    setAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleSubmit = async () => {
    // Collect answers array matching question index
    const answersArr = questions.map((_, i) => (answers[i] !== undefined ? answers[i] : -1));

    try {
      const res = await submitExam({ regId, answers: answersArr }).unwrap();
      setResults(res);
      setExamState("finished");
      toast.success("Exam submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit exam.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loadingCert) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-purple-600" size={36} />
      </div>
    );
  }

  if (!cert || questions.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 min-h-screen flex flex-col justify-center items-center">
        <AlertTriangle size={48} className="text-amber-500 mb-2" />
        <p className="font-medium text-slate-800">Exam questions are not configured yet.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-purple-600 font-semibold hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col select-none">
      {/* ─── HEADER ─── */}
      <header className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Award className="text-purple-500" />
          <h2 className="font-semibold text-slate-200 truncate max-w-xs md:max-w-md">{cert.name}</h2>
          <span className="px-2 py-0.5 text-[10px] bg-purple-900/60 text-purple-300 rounded font-medium">
            Official Exam
          </span>
        </div>

        {examState === "active" && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-purple-400 font-mono text-xl font-semibold">
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>
        )}
      </header>

      {/* ─── INTRO STATE ─── */}
      {examState === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-xl mx-auto text-center gap-6">
          <div className="w-24 h-24 rounded-full bg-purple-950 border border-purple-500 flex items-center justify-center text-purple-400 shadow-[0_0_24px_rgba(168,85,247,0.3)]">
            <Award size={48} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-100">Ready to start the exam?</h1>
            <p className="text-slate-400 text-base leading-relaxed">
              You are about to start the official mock exam simulator. Please ensure you have a stable connection. Distraction-free browser mode is recommended.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full bg-slate-950 p-4 border border-slate-800 rounded-2xl text-sm">
            <div className="text-center p-2">
              <p className="text-slate-500 font-medium mb-0.5">QUESTIONS</p>
              <p className="text-base font-semibold text-slate-200">{questions.length} Qs</p>
            </div>
            <div className="text-center p-2 border-x border-slate-800">
              <p className="text-slate-500 font-medium mb-0.5">TIME</p>
              <p className="text-base font-semibold text-slate-200">{cert.duration} Min</p>
            </div>
            <div className="text-center p-2">
              <p className="text-slate-500 font-medium mb-0.5">PASSING</p>
              <p className="text-base font-semibold text-slate-200">{cert.passingScore}% Score</p>
            </div>
          </div>

          <button
            onClick={() => setExamState("active")}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-purple-500/20"
          >
            I am Ready, Start Exam
          </button>
        </div>
      )}

      {/* ─── ACTIVE EXAM STATE ─── */}
      {examState === "active" && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main workspace */}
          <div className="flex-1 p-6 md:p-10 flex flex-col justify-between overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full space-y-8">
              {/* Question card */}
              <div className="space-y-4">
                <span className="text-sm uppercase font-semibold text-purple-400 tracking-widest font-mono">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <h2 className="text-xl md:text-2xl font-semibold leading-snug">
                  {questions[currentIdx].questionText}
                </h2>
              </div>

              {/* Choices */}
              <div className="flex flex-col gap-3">
                {questions[currentIdx].options.map((opt, oIdx) => {
                  const selected = answers[currentIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`flex items-center gap-3 w-full p-4 rounded-2xl border text-left text-base font-normal transition-all ${
                        selected
                          ? "bg-purple-950/80 border-purple-500 text-purple-200"
                          : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${selected ? "bg-purple-500 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions bottom */}
            <div className="border-t border-slate-800 pt-6 mt-8 flex items-center justify-between max-w-2xl mx-auto w-full">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-800 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={14} /> Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium text-slate-200 transition-all"
                >
                  Next <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : "Submit Exam"}
                </button>
              )}
            </div>
          </div>

          {/* Question Bubbles Sidebar */}
          <div className="w-full md:w-80 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div>
              <h3 className="font-semibold text-slate-300 text-sm tracking-wider uppercase mb-4">Question Map</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, i) => {
                  const answered = answers[i] !== undefined;
                  const active = currentIdx === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm transition-all ${
                        active
                          ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950"
                          : answered
                          ? "bg-purple-950/80 border border-purple-800 text-purple-300 font-semibold"
                          : "bg-slate-900 border border-slate-800 text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Total Answered</span>
                <span>{Object.keys(answers).length} / {questions.length}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : "Submit Examination"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FINISHED STATE ─── */}
      {examState === "finished" && results && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-xl mx-auto text-center gap-6">
          {results.passed ? (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)] mx-auto">
                <CheckCircle2 size={44} />
              </div>
              <h1 className="text-4xl font-bold text-slate-100">Congratulations, You Passed!</h1>
              <p className="text-slate-400 text-base leading-relaxed max-w-md mx-auto">
                You successfully passed the certification exam. Your digital credentials are now active, and you have earned a verified certificate.
              </p>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl inline-flex flex-col gap-1">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Verifiable ID</p>
                <p className="text-base font-mono text-purple-400 font-medium">{results.certificateId}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-red-950 border border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.3)] mx-auto">
                <XCircle size={44} />
              </div>
              <h1 className="text-4xl font-bold text-slate-100">Keep Practicing!</h1>
              <p className="text-slate-400 text-base leading-relaxed max-w-md mx-auto">
                You did not achieve the required passing score. Review the course material again and schedule another attempt.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 w-full bg-slate-950 p-4 border border-slate-800 rounded-2xl text-sm">
            <div className="text-center p-2 border-r border-slate-800">
              <p className="text-slate-500 font-medium mb-0.5">YOUR SCORE</p>
              <p className={`text-xl font-semibold ${results.passed ? "text-emerald-500" : "text-red-500"}`}>
                {results.score}%
              </p>
            </div>
            <div className="text-center p-2">
              <p className="text-slate-500 font-medium mb-0.5">PASSING GRADE</p>
              <p className="text-xl font-semibold text-slate-200">{cert.passingScore}%</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/subscribe")}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-colors"
            >
              Exit Dashboard
            </button>
            {results.passed ? (
              <button
                onClick={() => navigate("/home/my-courses/certifications")}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                View Certificate
              </button>
            ) : (
              <button
                onClick={() => {
                  setAnswers({});
                  setCurrentIdx(0);
                  setExamState("intro");
                  setResults(null);
                }}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Retry Exam
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamEnvironment;
