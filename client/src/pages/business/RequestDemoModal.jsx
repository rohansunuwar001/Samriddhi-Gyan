import React, { useState } from "react";
import PropTypes from "prop-types";
import { toast } from "sonner";
import {
  X,
  CheckCircle2,
  Building2,
  Users,
  Mail,
  User,
  Phone,
  Briefcase,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const RequestDemoModal = ({ isOpen, onClose, defaultPlan = "Enterprise Plan" }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    workEmail: "",
    companyName: "",
    teamSize: "21-200",
    jobTitle: "",
    phone: "",
    trainingNeeds: "",
    planInterest: defaultPlan,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.workEmail || !formData.companyName) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    // Simulate brief API dispatch
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Demo request received! Our enterprise learning specialist will contact you within 24 hours.");
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setFormData({
      firstName: "",
      lastName: "",
      workEmail: "",
      companyName: "",
      teamSize: "21-200",
      jobTitle: "",
      phone: "",
      trainingNeeds: "",
      planInterest: defaultPlan,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-[#1c1d1f] text-white p-6 sm:p-8 relative">
          <button
            onClick={handleResetAndClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#a435f0]"
            aria-label="Close demo request modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="inline-flex items-center gap-2 bg-[#5624d0]/40 text-purple-200 border border-purple-400/30 px-3.5 py-1.5 rounded-full text-base font-medium uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-purple-300" />
            Samriddhi Gyan Business
          </div>
          <h2 id="demo-modal-title" className="text-4xl sm:text-5xl font-bold tracking-tight">
            Request an Enterprise Demo
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mt-2 max-w-lg">
            See how Samriddhi Gyan Business helps organizations build in-demand tech, AI, and leadership skills.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-semibold text-[#1c1d1f]">Thank You, {formData.firstName}!</h3>
              <p className="text-gray-600 max-w-md mx-auto text-lg">
                We have received your demo request for <span className="font-medium text-[#1c1d1f]">{formData.companyName}</span>. A dedicated enterprise learning advisor will reach out to <span className="font-medium text-[#1c1d1f]">{formData.workEmail}</span> shortly.
              </p>
              <div className="pt-4">
                <Button
                  onClick={handleResetAndClose}
                  className="bg-[#1c1d1f] hover:bg-black text-white font-medium px-8 py-3.5 rounded-md text-lg"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh"
                      className="w-full pl-10 pr-3.5 py-3 bg-[#f6f7f9] border border-gray-300 rounded-md text-lg text-[#1c1d1f] focus:bg-white focus:border-[#5624d0] focus:ring-1 focus:ring-[#5624d0] outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="e.g. Adhikari"
                      className="w-full pl-10 pr-3.5 py-3 bg-[#f6f7f9] border border-gray-300 rounded-md text-lg text-[#1c1d1f] focus:bg-white focus:border-[#5624d0] focus:ring-1 focus:ring-[#5624d0] outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      name="workEmail"
                      required
                      value={formData.workEmail}
                      onChange={handleChange}
                      placeholder="ramesh@company.com"
                      className="w-full pl-10 pr-3.5 py-3 bg-[#f6f7f9] border border-gray-300 rounded-md text-lg text-[#1c1d1f] focus:bg-white focus:border-[#5624d0] focus:ring-1 focus:ring-[#5624d0] outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+977 98XXXXXXXX"
                      className="w-full pl-10 pr-3.5 py-3 bg-[#f6f7f9] border border-gray-300 rounded-md text-lg text-[#1c1d1f] focus:bg-white focus:border-[#5624d0] focus:ring-1 focus:ring-[#5624d0] outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Nabil Bank, Leapfrog"
                      className="w-full pl-10 pr-3.5 py-3 bg-[#f6f7f9] border border-gray-300 rounded-md text-lg text-[#1c1d1f] focus:bg-white focus:border-[#5624d0] focus:ring-1 focus:ring-[#5624d0] outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                    Company / Team Size
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      name="teamSize"
                      value={formData.teamSize}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-3 bg-[#f6f7f9] border border-gray-300 rounded-md text-lg text-[#1c1d1f] focus:bg-white focus:border-[#5624d0] focus:ring-1 focus:ring-[#5624d0] outline-none transition"
                    >
                      <option value="2-20">2 - 20 learners (Team Plan)</option>
                      <option value="21-200">21 - 200 learners (Enterprise)</option>
                      <option value="201-1000">201 - 1,000 learners (Enterprise)</option>
                      <option value="1000+">1,000+ learners (Global Enterprise)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                  Job Title / Function
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="e.g. VP of Engineering, HR Director, L&D Lead"
                    className="w-full pl-10 pr-3.5 py-3 bg-[#f6f7f9] border border-gray-300 rounded-md text-lg text-[#1c1d1f] focus:bg-white focus:border-[#5624d0] focus:ring-1 focus:ring-[#5624d0] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                  What are your organization's primary learning goals?
                </label>
                <textarea
                  name="trainingNeeds"
                  rows={2}
                  value={formData.trainingNeeds}
                  onChange={handleChange}
                  placeholder="e.g. Upskilling engineering in AI & Cloud certifications, onboarding new hires..."
                  className="w-full p-3.5 bg-[#f6f7f9] border border-gray-300 rounded-md text-lg text-[#1c1d1f] focus:bg-white focus:border-[#5624d0] focus:ring-1 focus:ring-[#5624d0] outline-none transition resize-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#5624d0] hover:bg-[#401b9c] text-white font-semibold py-4 rounded-md text-xl transition-all shadow-md flex items-center justify-center gap-2 h-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting request...</span>
                    </>
                  ) : (
                    <span>Submit Demo Request</span>
                  )}
                </Button>
                <p className="text-sm text-gray-500 text-center mt-3">
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

RequestDemoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  defaultPlan: PropTypes.string,
};

export default RequestDemoModal;
