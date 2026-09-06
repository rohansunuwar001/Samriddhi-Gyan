import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useUpdateUserInfoMutation } from "@/features/api/authApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import { useGetAllTopicsQuery } from "@/features/api/topicApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X, Search, Check, Loader2 } from "lucide-react";

const PersonalizeWizard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [updateUserInfo, { isLoading: isUpdating }] = useUpdateUserInfoMutation();

  // API Queries for dynamic categories and topics
  const { data: categoryData, isLoading: isLoadingCats } = useGetAllCategoriesQuery();
  const { data: topicData, isLoading: isLoadingTopics } = useGetAllTopicsQuery();

  const categories = categoryData?.categories || [];
  const topics = topicData?.topics || [];

  const [step, setStep] = useState(1);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [certSearch, setCertSearch] = useState("");

  // Prefill state from user profile if it exists
  useEffect(() => {
    if (user && categories.length > 0) {
      if (user.occupation) {
        // Find matching occupation category in the list
        const occ = categories.find(c => c.name.toLowerCase() === user.occupation.toLowerCase());
        if (occ) {
          setSelectedOccupation(occ);
          const parentId = occ.parent?._id || occ.parent;
          const parentCat = categories.find(c => c._id === parentId);
          if (parentCat) {
            setSelectedField(parentCat);
          }
        } else {
          setSelectedOccupation({ name: user.occupation, _id: "custom-occ" });
        }
      }
      if (user.interests) {
        const certNames = topics.filter(t => t.type === 'certification').map(t => t.name);
        const userCerts = user.interests.filter(i => certNames.includes(i));
        const userSkills = user.interests.filter(i => !certNames.includes(i));
        setSelectedSkills(userSkills);
        setSelectedCerts(userCerts);
      }
    }
  }, [user, categories, topics]);

  // Derived options for fields (parent categories)
  const fields = categories.filter(c => !c.parent);

  // Derived options for occupations (subcategories under selected field)
  let occupations = [];
  if (selectedField) {
    occupations = categories.filter(c => c.parent && (c.parent._id === selectedField._id || c.parent === selectedField._id));
  }

  // Derived suggested skills for Step 3
  let suggestedSkills = [];
  let totalLearners = 0;
  if (selectedOccupation) {
    const subCategories = categories.filter(c => c.parent && (c.parent._id === selectedOccupation._id || c.parent === selectedOccupation._id));
    const subCategoryNames = subCategories.map(sc => sc.name);
    
    const allTopics = topics.filter(t => t.type === 'topic');
    const matchingTopics = allTopics.filter(t => 
      t.parentCategory === selectedOccupation.name || subCategoryNames.includes(t.parentCategory)
    );
    
    const suggestedSkillNames = [...new Set([
      ...subCategoryNames,
      ...matchingTopics.map(t => t.name)
    ])];

    suggestedSkills = suggestedSkillNames;

    // If no matching subcategories or topics exist for this specific occupation,
    // suggest the most popular topics in the entire database (the ones a lot of people engaged with)
    if (suggestedSkills.length === 0) {
      const popularTopics = [...allTopics]
        .sort((a, b) => (b.numLearners || 0) - (a.numLearners || 0))
        .slice(0, 10);
      suggestedSkills = popularTopics.map(t => t.name);
    }

    // If still empty (e.g. no topics exist at all), show all Level 3 categories from the database
    if (suggestedSkills.length === 0) {
      const level3Cats = categories.filter(c => {
        if (!c.parent) return false;
        const parentCat = categories.find(pc => pc._id === c.parent?._id || pc._id === c.parent);
        return parentCat && parentCat.parent;
      });
      suggestedSkills = level3Cats.map(c => c.name);
    }

    // Dynamic learner count calculation - ONLY actual count from matching topics
    totalLearners = matchingTopics.reduce((sum, t) => sum + (t.numLearners || 0), 0);
  }

  // Derived certifications for Step 4
  let availableCerts = [];
  if (selectedField) {
    const dbCerts = topics.filter(t => t.type === 'certification');
    availableCerts = dbCerts.filter(c => 
      c.parentCategory === selectedField.name || 
      c.parentCategory === selectedOccupation?.name ||
      selectedSkills.includes(c.parentCategory)
    );
    
    // If no matching certs exist, show all certifications from the database
    if (availableCerts.length === 0) {
      availableCerts = dbCerts;
    }
    
    availableCerts = availableCerts.map(c => ({ 
      id: c._id, 
      name: c.name, 
      provider: c.description || "Official Certification", 
      iconText: c.name.slice(0, 3).toUpperCase() 
    }));
  }

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
    const combinedInterests = [...selectedSkills, ...selectedCerts];
    try {
      await updateUserInfo({
        occupation: selectedOccupation?.name || "",
        interests: combinedInterests,
      }).unwrap();
      toast.success("Preferences updated successfully! Recommended feeds updated.");
      navigate("/");
    } catch (err) {
      toast.error("Failed to update preferences. Please try again.");
    }
  };

  const progressPercentage = (step / 4) * 100;

  if (isLoadingCats || isLoadingTopics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans text-slate-800">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4" />
        <p className="text-base text-slate-500 font-light">Loading personalized onboarding setup...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans text-left text-slate-800">
      
      {/* Header bar */}
      <header className="border-b border-slate-200 px-6 py-4 flex items-center justify-between select-none shrink-0 bg-white">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <span className="text-2xl font-normal tracking-tight text-[#1c1d1f]">
            Samriddhi <span className="text-violet-600">Gyan</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/")}
            className="text-base font-normal text-slate-700 hover:text-slate-900 focus:outline-none"
          >
            Save & exit
          </button>
          <button className="border border-slate-300 rounded px-3 py-1.5 text-sm font-normal text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 focus:outline-none">
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
              <h1 className="text-4xl font-normal tracking-tight text-slate-900">
                What field are you learning for?
              </h1>
              <p className="text-base text-slate-500 mt-2 font-light">
                Select a main category that matches your interest area.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-4">
              {fields.map((field) => (
                <label 
                  key={field._id}
                  className="flex items-center gap-3 py-2 cursor-pointer group text-slate-700 hover:text-slate-950 font-normal"
                >
                  <input
                    type="radio"
                    name="field"
                    value={field._id}
                    checked={selectedField?._id === field._id}
                    onChange={() => {
                      setSelectedField(field);
                      setSelectedOccupation(null);
                    }}
                    className="h-4.5 w-4.5 text-violet-600 border-slate-300 focus:ring-violet-500 cursor-pointer"
                  />
                  <span className="text-[15px] font-normal leading-tight">
                    {field.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h1 className="text-4xl font-normal tracking-tight text-slate-900">
                Which occupation are you learning for?
              </h1>
              <p className="text-base text-slate-500 mt-2 font-light">
                {selectedField?.name} occupations
              </p>
            </div>

            {occupations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-4">
                {occupations.map((occ) => (
                  <label 
                    key={occ._id}
                    className="flex items-center gap-3 py-2 cursor-pointer group text-slate-700 hover:text-slate-950 font-normal"
                  >
                    <input
                      type="radio"
                      name="occupation"
                      value={occ._id}
                      checked={selectedOccupation?._id === occ._id || selectedOccupation?.name === occ.name}
                      onChange={() => setSelectedOccupation(occ)}
                      className="h-4.5 w-4.5 text-violet-600 border-slate-300 focus:ring-violet-500 cursor-pointer"
                    />
                    <span className="text-[15px] font-normal leading-tight">
                      {occ.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-4 pt-4 max-w-md">
                <p className="text-sm text-slate-500 font-light">
                  No occupations found in this category. Please type your occupation below:
                </p>
                <input
                  type="text"
                  value={selectedOccupation?.name || ""}
                  onChange={(e) => setSelectedOccupation({ name: e.target.value, _id: "custom-occ" })}
                  placeholder="e.g. UI/UX Designer"
                  className="w-full border border-slate-300 rounded p-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all animate-in fade-in duration-200"
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              {selectedOccupation && (
                <div className="bg-[#f7f9fa] border border-[#d1d7dc] rounded-lg p-4 mb-6 flex items-start gap-3">
                  <div className="mt-0.5 text-slate-600 bg-slate-200 rounded-full h-5 w-5 flex items-center justify-center font-normal text-sm shrink-0 font-bold">
                    i
                  </div>
                  <div>
                    <h4 className="font-normal text-base text-slate-800">You're in the right place!</h4>
                    <p className="text-sm text-slate-500 mt-0.5">
                      <strong>{totalLearners.toLocaleString()}</strong> people learn <strong>{selectedOccupation.name}</strong> on Samriddhi Gyan.
                    </p>
                  </div>
                </div>
              )}
              <h1 className="text-4xl font-normal tracking-tight text-slate-900">
                What skills are you interested in?
              </h1>
              <p className="text-base text-slate-500 mt-2">
                Choose a few to start with. You can change these or follow more skills in the future.
              </p>
            </div>

            {/* Selected tags pill box & search bar input */}
            <div className="border border-slate-300 rounded p-3 bg-white space-y-3 focus-within:ring-2 focus-within:ring-violet-400 focus-within:border-transparent transition-all">
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span 
                    key={skill}
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-sm font-normal px-3 py-1.5 rounded-full border border-slate-200"
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
                  className="w-full text-base outline-none border-none p-1 placeholder:text-slate-400 focus:ring-0"
                />
              </div>
            </div>

            {/* Suggested skills tags */}
            <div className="space-y-6 pt-4">
              <h3 className="font-normal text-base text-slate-800 tracking-wide uppercase">
                Popular with learners like you
              </h3>

              <div className="flex flex-wrap gap-2.5">
                {suggestedSkills.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase())).map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => handleToggleSkill(skill)}
                      className={`flex items-center gap-1 px-4 py-2 text-sm font-normal rounded-full border transition-all ${
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white" 
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <span>+</span>}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h1 className="text-4xl font-normal tracking-tight text-slate-900">
                Are you interested in any certifications?
              </h1>
              <p className="text-base text-slate-500 mt-2">
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
                className="w-full text-base outline-none border-none p-1 placeholder:text-slate-400 focus:ring-0"
              />
            </div>

            {/* Certification Checklist Cards */}
            <div className="space-y-4 pt-2">
              <h3 className="font-normal text-base text-slate-800 tracking-wide uppercase">
                Popular with learners like you
              </h3>

              {availableCerts.length > 0 ? (
                <div className="space-y-3">
                  {availableCerts.filter(c => c.name.toLowerCase().includes(certSearch.toLowerCase())).map((cert) => {
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
                            <h4 className="font-normal text-[15px] text-slate-900 leading-tight">
                              {cert.name}
                            </h4>
                            <p className="text-sm text-slate-400 font-light mt-1">
                              {cert.provider}
                            </p>
                          </div>
                        </div>
                        <div className="h-10 w-10 bg-slate-100 flex items-center justify-center rounded font-normal text-sm text-slate-500 uppercase tracking-widest shrink-0 border border-slate-200 select-none">
                          {cert.iconText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 font-light py-4">
                  No certifications match this category at this time.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-white select-none shrink-0">
        <button
          onClick={() => step > 1 && setStep(step - 1)}
          disabled={step === 1}
          className="text-base font-normal text-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed hover:underline focus:outline-none"
        >
          Back
        </button>

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && !selectedField) || (step === 2 && !selectedOccupation)}
            className="bg-slate-900 hover:bg-black text-white font-normal px-6 py-2 rounded-none animate-in fade-in"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="bg-violet-600 hover:bg-violet-700 text-white font-normal px-6 py-2 rounded-none"
          >
            {isUpdating ? "Submitting..." : "Submit"}
          </Button>
        )}
      </footer>

    </div>
  );
};

export default PersonalizeWizard;
