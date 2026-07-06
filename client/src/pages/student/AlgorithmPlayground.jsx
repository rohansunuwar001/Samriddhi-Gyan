import React, { useState } from "react";
import {
  Play,
  FileText,
  Code,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCode,
  Plus,
  Trash2,
  Sliders,
  HelpCircle,
  RefreshCw,
  Eye,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useValidateCodeASTMutation, useCheckPlagiarismLSHMutation } from "@/features/api/evaluationApi";

const DEFAULT_CODE_SAMPLE = `// Welcome to the AST Parser Playground
// Write or edit your JS logic here to analyze its AST structure!

const totalCount = 10;
let cumulativeSum = 0;

for (let currentVal = 1; currentVal <= totalCount; currentVal++) {
  cumulativeSum = cumulativeSum + currentVal;
  print("Adding value to sum:", currentVal);
}

function print(message, value) {
  // Mock logger function
  return message + " " + value;
}
`;

const DEFAULT_DOC_SAMPLE = `React is an open-source frontend library designed by Meta for composing reusable UI components. It manages local state and builds user interfaces efficiently using a virtual DOM representation.`;

const DEFAULT_REFS_MOCK = [
  {
    id: "Doc A: React and Component Architecture",
    text: "React is a free and open-source front-end JavaScript library for building user interfaces based on components. It is maintained by Meta and a community of individual developers and companies."
  },
  {
    id: "Doc B: Node.js Architecture",
    text: "Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser. It is built on the Chrome V8 engine and uses an event-driven, non-blocking I/O model."
  },
  {
    id: "Doc C: State Management Options",
    text: "State management in React can be handled with the useState hook for local state, or Redux Toolkit for complex global state. Using state correctly ensures that components render efficiently."
  }
];

const AVAILABLE_STRUCTURES = [
  { value: "VariableDeclaration", label: "Variable Declarations (const/let/var)" },
  { value: "ForStatement", label: "For Loop Blocks (for)" },
  { value: "WhileStatement", label: "While Loop Blocks (while)" },
  { value: "FunctionDeclaration", label: "Custom Function Declarations" },
  { value: "CallExpression", label: "Function Calls / Invocations" },
  { value: "Literal", label: "String / Number Literals" }
];

const ASTNodeRenderer = ({ node, name = "Root" }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!node || typeof node !== "object") {
    return <span className="text-emerald-600 font-mono"> {JSON.stringify(node)}</span>;
  }

  const isArray = Array.isArray(node);
  const keys = Object.keys(node).filter((k) => k !== "fail" && k !== "output");

  return (
    <div className="pl-4 border-l border-slate-200/60 my-1 font-mono text-xs">
      <div
        className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 p-0.5 rounded transition-all select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-slate-500 font-semibold">{name}:</span>
        <span className="text-indigo-600 font-bold">
          {isArray ? `Array [${node.length}]` : node.type || "Object"}
        </span>
        <span className="text-[10px] text-slate-400">
          {collapsed ? "[+ expand]" : "[- collapse]"}
        </span>
      </div>

      {!collapsed && (
        <div className="pl-3 space-y-0.5 mt-0.5">
          {keys.map((key) => (
            <div key={key} className="flex flex-wrap items-baseline gap-1">
              {typeof node[key] === "object" && node[key] !== null ? (
                <ASTNodeRenderer node={node[key]} name={key} />
              ) : (
                <>
                  <span className="text-slate-600 font-medium">{key}:</span>
                  <span className="text-amber-700">
                    {JSON.stringify(node[key])}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AlgorithmPlayground = () => {
  const [activeTab, setActiveTab] = useState("ast");

  // AST State
  const [code, setCode] = useState(DEFAULT_CODE_SAMPLE);
  const [selectedStructures, setSelectedStructures] = useState(["ForStatement", "VariableDeclaration"]);
  const [astResult, setAstResult] = useState(null);

  // Plagiarism State
  const [docText, setDocText] = useState(DEFAULT_DOC_SAMPLE);
  const [comparisonDocs, setComparisonDocs] = useState(DEFAULT_REFS_MOCK);
  const [threshold, setThreshold] = useState(0.4);
  const [plagiarismResult, setPlagiarismResult] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocText, setNewDocText] = useState("");

  // RTK Mutations
  const [validateCodeAST, { isLoading: isASTLoading }] = useValidateCodeASTMutation();
  const [checkPlagiarismLSH, { isLoading: isPlagiarismLoading }] = useCheckPlagiarismLSHMutation();

  // AST structural checklist handlers
  const handleStructureToggle = (structure) => {
    if (selectedStructures.includes(structure)) {
      setSelectedStructures(selectedStructures.filter((s) => s !== structure));
    } else {
      setSelectedStructures([...selectedStructures, structure]);
    }
  };

  const handleRunASTValidation = async () => {
    try {
      const res = await validateCodeAST({
        code,
        requiredStructures: selectedStructures
      }).unwrap();

      if (res.success) {
        setAstResult(res);
        toast.success("AST generation complete!");
      } else {
        toast.error(res.message || "Failed to analyze code structure.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error evaluating AST code validator.");
    }
  };

  // Plagiarism list handlers
  const handleAddReferenceDoc = () => {
    if (!newDocTitle.trim() || !newDocText.trim()) {
      toast.error("Title and content are required to add reference document.");
      return;
    }
    setComparisonDocs([
      ...comparisonDocs,
      { id: `Ref: ${newDocTitle.trim()}`, text: newDocText.trim() }
    ]);
    setNewDocTitle("");
    setNewDocText("");
    toast.success("New reference document added to library.");
  };

  const handleDeleteReferenceDoc = (index) => {
    setComparisonDocs(comparisonDocs.filter((_, idx) => idx !== index));
    toast.info("Reference document removed.");
  };

  const handleRunPlagiarismCheck = async () => {
    try {
      const res = await checkPlagiarismLSH({
        docText,
        referenceDocs: comparisonDocs,
        threshold: Number(threshold)
      }).unwrap();

      if (res.success) {
        setPlagiarismResult(res);
        toast.success("Plagiarism evaluation complete!");
      } else {
        toast.error(res.message || "Failed to scan text duplicates.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error checking plagiarism.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
          <FileCode className="h-9 w-9 text-indigo-600 animate-pulse" />
          Advanced Algorithms Playground
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-base">
          Inspect, play with, and trigger advanced NLP and Compiler parsing algorithms compiled from our platform backend.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 mb-8 max-w-md mx-auto justify-center bg-slate-100 p-1.5 rounded-lg border">
        <button
          onClick={() => setActiveTab("ast")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-all ${
            activeTab === "ast"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Code className="h-4 w-4" />
          AST Code Parser
        </button>
        <button
          onClick={() => setActiveTab("plagiarism")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-all ${
            activeTab === "plagiarism"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="h-4 w-4" />
          LSH Plagiarism Checker
        </button>
      </div>

      {/* TAB CONTENT: AST CODE VALIDATOR */}
      {activeTab === "ast" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Panel (Left) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-indigo-500" />
                  Code Submission Editor (JavaScript)
                </span>
                <button
                  onClick={() => setCode(DEFAULT_CODE_SAMPLE)}
                  className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reset Sample
                </button>
              </div>
              <div className="p-4 bg-slate-950 font-mono text-sm text-indigo-300">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-80 bg-transparent text-indigo-200 outline-none resize-none font-mono leading-relaxed"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Checklist Selection */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-slate-500" />
                Required AST Structures to Validate
              </span>
              <p className="text-xs text-slate-500">
                The parser validation will verify if all selected structure nodes exist inside the abstract tree.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {AVAILABLE_STRUCTURES.map((struct) => (
                  <label
                    key={struct.value}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none text-xs text-slate-700 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStructures.includes(struct.value)}
                      onChange={() => handleStructureToggle(struct.value)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5"
                    />
                    {struct.label}
                  </label>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleRunASTValidation}
                  disabled={isASTLoading || !code.trim()}
                  className="w-full h-11 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 flex justify-center items-center gap-2"
                >
                  {isASTLoading ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                      Parsing Compiler Code...
                    </>
                  ) : (
                    <>
                      <Play className="h-4.5 w-4.5" />
                      Run AST Validator
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* AST Results Panel (Right) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-600" />
                  AST Compiler Results
                </span>
              </div>
              <div className="p-6 space-y-4">
                {astResult ? (
                  <>
                    {/* Status Alert */}
                    {astResult.error ? (
                      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-3">
                        <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Compilation Parsing Failed</span>
                          <p className="mt-1">{astResult.error}</p>
                        </div>
                      </div>
                    ) : astResult.isValid ? (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold block">AST Code Validation Passed!</span>
                          <p className="mt-1">All selected AST syntax components were identified successfully in the tree.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold block">AST Validation Failed</span>
                          <p className="mt-1">
                            Your code parsed correctly, but is missing one or more required syntax structures selected in the checklist.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AST Node Tree Visualizer */}
                    {astResult.ast && (
                      <div className="border border-slate-200 rounded-lg bg-slate-50 p-4 max-h-[420px] overflow-y-auto">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                          Interactive Abstract Syntax Tree (AST)
                        </span>
                        <ASTNodeRenderer node={astResult.ast} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm space-y-2">
                    <Info className="h-8 w-8 text-slate-300 mx-auto" />
                    <p>Submit JavaScript code to view parsing trees and structure status.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PLAGIARISM CHECKER */}
      {activeTab === "plagiarism" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Column (Left) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Target Document Text */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  Target Document Submission
                </span>
                <button
                  onClick={() => setDocText(DEFAULT_DOC_SAMPLE)}
                  className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reset Sample
                </button>
              </div>
              <div className="p-4">
                <textarea
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  className="w-full h-36 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
                  placeholder="Paste or write the student submission text to compare..."
                />
              </div>
            </div>

            {/* Threshold Slider and Settings */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-slate-500" />
                  Jaccard Similarity LSH Threshold
                </span>
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-bold">
                  {(threshold * 100).toFixed(0)}% Match
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 font-semibold">0% (All Matches)</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold">100% (Exact Only)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                LSH clusters candidate shingle collisions. Matches equal to or exceeding the threshold will be flagged as duplicates.
              </p>
            </div>

            {/* Reference Documents Library Manager */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-5">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-500" />
                Comparison Reference Library ({comparisonDocs.length} files)
              </span>

              {/* Reference list */}
              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                {comparisonDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 p-3.5 rounded-lg bg-slate-50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-800 block">{doc.id}</span>
                      <p className="text-slate-500 line-clamp-2 leading-relaxed">{doc.text}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteReferenceDoc(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-all shrink-0 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Reference Document Form */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Add Document to Comparison Group</span>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Document Title (e.g. Reference C)"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white outline-none focus:border-indigo-500"
                  />
                  <textarea
                    placeholder="Document text content to compare shingles..."
                    value={newDocText}
                    onChange={(e) => setNewDocText(e.target.value)}
                    className="w-full h-18 p-3 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white outline-none focus:border-indigo-500 resize-none"
                  />
                  <Button
                    onClick={handleAddReferenceDoc}
                    className="w-full h-9 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Comparison Document
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleRunPlagiarismCheck}
                  disabled={isPlagiarismLoading || !docText.trim() || comparisonDocs.length === 0}
                  className="w-full h-11 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 flex justify-center items-center gap-2"
                >
                  {isPlagiarismLoading ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                      Evaluating MinHash Signatures...
                    </>
                  ) : (
                    <>
                      <Play className="h-4.5 w-4.5" />
                      Run Plagiarism Checker
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Plagiarism Results Panel (Right) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-600" />
                  MinHash & LSH Results
                </span>
              </div>
              <div className="p-6 space-y-4">
                {plagiarismResult ? (
                  <>
                    <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-xs">
                      <span className="font-bold block text-indigo-950 mb-1">LSH Hashing Overview</span>
                      <p className="leading-relaxed">
                        Scanned target shingles (5-grams) against {plagiarismResult.totalCompared} files using MinHash signature hashes at threshold {(plagiarismResult.threshold * 100).toFixed(0)}%.
                      </p>
                    </div>

                    {plagiarismResult.matches && plagiarismResult.matches.length > 0 ? (
                      <div className="space-y-4">
                        <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
                          ⚠️ Plagiarism Duplication Flags
                        </span>

                        {plagiarismResult.matches.map((match) => (
                          <div
                            key={match.id}
                            className="border border-rose-200 bg-rose-50/10 p-4 rounded-lg space-y-2.5 text-xs"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 truncate max-w-[200px]">
                                {match.id}
                              </span>
                              <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-bold">
                                {(match.similarity * 100).toFixed(0)}% Match
                              </Badge>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-rose-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${match.similarity * 100}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Estimated Jaccard similarity exceeds the threshold limit. Shingle collision flagged.
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold block">No Plagiarism Matches Flagged</span>
                          <p className="mt-1">
                            Estimated document shingle similarity is below the set threshold across all comparison reference documents.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm space-y-2">
                    <Info className="h-8 w-8 text-slate-300 mx-auto" />
                    <p>Run plagiarism checks to generate MinHash shingle signatures and LSH comparisons.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple inline Badge component to prevent shadcn dependencies issues
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
    {children}
  </span>
);

export default AlgorithmPlayground;
