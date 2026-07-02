import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useUpdateUserInfoMutation } from "@/features/api/authApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X, Search, Check, ChevronRight } from "lucide-react";

const OCCUPATIONS = [
  "Android Developer",
  "Back End Web Developer",
  "Data Engineer",
  "DevOps Engineer",
  "Front End Web Developer",
  "Full Stack Web Developer",
  "Game Developer",
  "iOS Developer",
  "Java Developer",
  "JavaScript Developer",
  "Machine Learning Engineer",
  "Mobile Application Developer",
  ".NET Developer",
  "PHP Developer",
  "Python Developer",
  "Software Architect",
  "Software Developer",
  "Software Quality Assurance Engineer",
  "Software Tester",
  "Web Developer",
  "WordPress Developer",
];

const SKILLS_BY_CATEGORY = {
  "Software Frameworks": ["Angular", "Redux Framework", "Vue JS", "Bootstrap", "Next.js"],
  "Software Libraries": ["React JS", "Node.js"],
  "Programming Languages": ["JavaScript", "CSS", "HTML", "Typescript", "Python", "SQL", "Java", "C++", "Ruby"]
};

const CERTIFICATIONS = [
  { id: "aws-assoc", name: "AWS Certified Solutions Architect – Associate", provider: "Amazon Web Services Training and Certification", iconText: "AWS" },
  { id: "ccna", name: "CCNA", provider: "Cisco", iconText: "CCNA" },
  { id: "pmp", name: "Project Management Professional (PMP)®", provider: "Project Management Institute", iconText: "PMP" },
  { id: "aws-pract", name: "AWS Certified Cloud Practitioner", provider: "Amazon Web Services Training and Certification", iconText: "AWS" }
];

const PersonalizeWizard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [updateUserInfo, { isLoading: isUpdating }] = useUpdateUserInfoMutation();

  const [step, setStep] = useState(1);
  const [selectedOccupation, setSelectedOccupation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [certSearch, setCertSearch] = useState("");

  // Prefill state from user profile if it exists
  useEffect(() => {
    if (user) {
      if (user.occupation) setSelectedOccupation(user.occupation);
      if (user.interests) {
        // Filter out certifications from interests array to split them cleanly
        const certNames = CERTIFICATIONS.map(c => c.name);
        const userCerts = user.interests.filter(i => certNames.includes(i));
        const userSkills = user.interests.filter(i => !certNames.includes(i));
        setSelectedSkills(userSkills);
        setSelectedCerts(userCerts);
      }
    }
  }, [user]);

  const handleToggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    if (e.key === "Enter" && skillSearch.trim()) {
      const trimmed = skillSearch.trim();
      if (!selectedSkills.includes(trimmed)) {
        setSelectedSkills([...selectedSkills, trimmed]);
      }
      setSkillSearch("");
    }
  };

  const handleRemoveSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const handleToggleCert = (certName) => {
    if (selectedCerts.includes(certName)) {
      setSelectedCerts(selectedCerts.filter((c) => c !== certName));
    } else {
      setSelectedCerts([...selectedCerts, certName]);
    }
  };

  const handleSubmit = async () => {
    // Combine skills and certifications into one unified interests array for recommendation mapping
    const combinedInterests = [...selectedSkills, ...selectedCerts];
    try {
      await updateUserInfo({
        occupation: selectedOccupation,
        interests: combinedInterests,
      }).unwrap();
      toast.success("Preferences updated successfully! Recommended feeds updated.");
      navigate("/");
    } catch (err) {
      toast.error("Failed to update preferences. Please try again.");
    }
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans text-left text-slate-800">
      
      {/* Header bar */}
      <header className="border-b border-slate-200 px-6 py-4 flex items-center justify-between select-none shrink-0 bg-white">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <span className="text-xl font-black tracking-tight text-[#1c1d1f]">
            Samriddhi <span className="text-violet-600">Gyan</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/")}
            className="text-sm font-bold text-slate-700 hover:text-slate-900 focus:outline-none"
          >
            Save & exit
          </button>
          <button className="border border-slate-300 rounded px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 focus:outline-none">
            English
          </button>
        </div>
      </header>

      {/* Progress track line */}
      <div className="w-full bg-slate-100 h-1 relative">
        <div 
          className="bg-violet-600 h-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Content wrapper */}
      <main className="flex-1 overflow-y-auto px-6 py-12 md:py-16 max-w-4xl mx-auto w-full">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Which occupation are you learning for?
              </h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Software Development occupations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-4">
              {OCCUPATIONS.map((occ) => (
                <label 
                  key={occ}
                  className="flex items-center gap-3 py-2 cursor-pointer group text-slate-700 hover:text-slate-950 font-normal"
                >
                  <input
                    type="radio"
                    name="occupation"
                    value={occ}
                    checked={selectedOccupation === occ}
                    onChange={() => setSelectedOccupation(occ)}
                    className="h-4.5 w-4.5 text-violet-600 border-slate-300 focus:ring-violet-500 cursor-pointer"
                  />
                  <span className="text-[15px] font-normal leading-tight">
                    {occ}
                  </span>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <button className="text-sm font-bold text-violet-600 hover:underline">
                I can't find my occupation
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              {selectedOccupation && (
                <div className="bg-[#f7f9fa] border border-[#d1d7dc] rounded-lg p-4 mb-6 flex items-start gap-3">
                  <div className="mt-0.5 text-slate-600 bg-slate-200 rounded-full h-5 w-5 flex items-center justify-center font-bold text-xs shrink-0">
                    ℹ
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">You're in the right place!</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Many learners setting up plans choose skills matching <strong>{selectedOccupation}</strong>.
                    </p>
                  </div>
                </div>
              )}
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                What skills are you interested in?
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Choose a few to start with. You can change these or follow more skills in the future.
              </p>
            </div>

            {/* Selected tags pill box & search bar input */}
            <div className="border border-slate-300 rounded p-3 bg-white space-y-3 focus-within:ring-2 focus-within:ring-violet-400 focus-within:border-transparent transition-all">
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span 
                    key={skill}
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200"
                  >
                    <span>{skill}</span>
                    <button 
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  onKeyDown={handleAddCustomSkill}
                  placeholder="Search for a skill (press Enter to add Custom)"
                  className="w-full text-sm outline-none border-none p-1 placeholder:text-slate-400 focus:ring-0"
                />
              </div>
            </div>

            {/* Structured recommended categories grid */}
            <div className="space-y-6 pt-4">
              <h3 className="font-bold text-sm text-slate-800 tracking-wide uppercase">
                Popular with learners like you
              </h3>

              {Object.entries(SKILLS_BY_CATEGORY).map(([category, list]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {list.map((skill) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => handleToggleSkill(skill)}
                          className={`flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                            isSelected 
                              ? "bg-slate-900 border-slate-900 text-white" 
                              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3 text-white" /> : <span>+</span>}
                          <span>{skill}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Are you interested in any certifications?
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Preparational guides or exam trackers that align with your career goals.
              </p>
            </div>

            {/* Certification Search bar */}
            <div className="border border-slate-300 rounded p-3.5 bg-white flex items-center gap-2 focus-within:ring-2 focus-within:ring-violet-400 transition-all">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                placeholder="Search for a certification"
                className="w-full text-sm outline-none border-none p-1 placeholder:text-slate-400 focus:ring-0"
              />
            </div>

            {/* Certification Checklist Cards */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-sm text-slate-800 tracking-wide uppercase">
                Popular with learners like you
              </h3>

              <div className="space-y-3">
                {CERTIFICATIONS.filter(c => c.name.toLowerCase().includes(certSearch.toLowerCase())).map((cert) => {
                  const isChecked = selectedCerts.includes(cert.name);
                  return (
                    <div 
                      key={cert.id}
                      onClick={() => handleToggleCert(cert.name)}
                      className={`border p-4.5 flex items-center justify-between cursor-pointer transition-all ${
                        isChecked 
                          ? "border-violet-600 bg-violet-50/20" 
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-5 w-5 border flex items-center justify-center shrink-0 ${isChecked ? "bg-violet-600 border-violet-600 text-white" : "border-slate-300 bg-white"}`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-[15px] text-slate-900 leading-tight">
                            {cert.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium mt-1">
                            {cert.provider}
                          </p>
                        </div>
                      </div>
                      <div className="h-10 w-10 bg-slate-100 flex items-center justify-center rounded font-black text-xs text-slate-500 uppercase tracking-widest shrink-0 border border-slate-200 select-none">
                        {cert.iconText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-white select-none shrink-0">
        <button
          onClick={() => step > 1 && setStep(step - 1)}
          disabled={step === 1}
          className="text-sm font-bold text-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed hover:underline focus:outline-none"
        >
          Back
        </button>

        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !selectedOccupation}
            className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2 rounded-none"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-2 rounded-none"
          >
            {isUpdating ? "Submitting..." : "Submit"}
          </Button>
        )}
      </footer>

    </div>
  );
};

export default PersonalizeWizard;
