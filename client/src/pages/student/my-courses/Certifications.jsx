import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Award, Play, ExternalLink } from "lucide-react";
import { useGetRegistrationsQuery } from "@/features/api/certificationApi";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Certifications = () => {
  const { data, isLoading } = useGetRegistrationsQuery();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Filter only purchased/completed registrations
  const registrations = (data?.registrations || []).filter(
    (reg) => reg.paymentStatus === "completed"
  );

  if (registrations.length === 0) {
    return (
      <div className="bg-white border border-[#d1d7dc] p-10 text-center rounded-none shadow-sm space-y-3">
        <BookOpen className="h-8 w-8 text-gray-300 mx-auto" />
        <h4 className="font-light text-xl text-[#2d2f31]">
          Earn certifications
        </h4>
        <p className="text-lg text-[#6a6f73] max-w-sm mx-auto leading-relaxed">
          Complete your enrolled courses fully to unlock certificates and prove your skills to employers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-6">
        {registrations.map((reg) => {
          const cert = reg.certification;
          if (!cert) return null;

          return (
            <div
              key={reg._id}
              className="bg-white border border-[#d1d7dc] flex flex-col md:flex-row items-center gap-6 p-6 shadow-sm hover:shadow-md transition-all rounded-none"
            >
              {/* Badge Image */}
              <div className="w-24 h-24 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden p-2">
                <img
                  src={cert.badgeUrl || "/default-badge.png"}
                  alt={cert.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 text-left space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">
                    {cert.name}
                  </h3>
                  <Badge
                    className={`text-sm font-semibold px-2.5 py-0.5 rounded-none uppercase ${
                      reg.examStatus === "completed"
                        ? reg.passed
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100 text-red-800 border-red-200"
                        : "bg-purple-100 text-purple-800 border-purple-200"
                    }`}
                  >
                    {reg.examStatus === "completed"
                      ? reg.passed
                        ? "Passed"
                        : "Failed"
                      : reg.examStatus === "started"
                      ? "In Progress"
                      : "Registered"}
                  </Badge>
                </div>
                <p className="text-base text-slate-500 line-clamp-2 leading-relaxed">
                  {cert.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 font-medium">
                  <span>Duration: {cert.examDuration || 60} mins</span>
                  <span>•</span>
                  <span>Questions: {cert.questionsCount || 40}</span>
                  {reg.examStatus === "completed" && (
                    <>
                      <span>•</span>
                      <span className="text-slate-600 font-semibold">Score: {reg.score}%</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
                {reg.examStatus === "completed" ? (
                  reg.passed ? (
                    <Button
                      variant="outline"
                      onClick={() => window.open(`http://localhost:10000/api/v1/certificate/verify/${reg.certificateId}`, "_blank")}
                      className="text-base font-semibold border-[#1c1d1f] hover:bg-slate-50 text-slate-700 h-10 px-4 rounded-none transition-colors w-full md:w-44 flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-4 h-4 text-purple-600" />
                      View Certificate
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate(`/certification/${cert.slug}`)}
                      className="text-base font-semibold bg-[#1c1d1f] hover:bg-[#2d2f31] text-white h-10 px-4 rounded-none transition-colors w-full md:w-44"
                    >
                      Reapply
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={() => navigate(`/certification/${cert.slug}`)}
                    className="text-base font-semibold bg-purple-600 hover:bg-purple-700 text-white h-10 px-4 rounded-none transition-colors w-full md:w-44 flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {reg.examStatus === "started" ? "Resume Exam" : "Take Exam"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/certification/${cert.slug}`)}
                  className="text-base font-semibold text-slate-600 hover:text-purple-600 w-full md:w-44 h-10 px-4 rounded-none"
                >
                  View Details
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Certifications;
