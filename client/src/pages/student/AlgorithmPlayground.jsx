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
  Info,
  UploadCloud,
  File
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useValidateCodeASTMutation, useCheckPlagiarismLSHMutation, useCrossComparePlagiarismMutation } from "@/features/api/evaluationApi";

const LANGUAGE_SAMPLES = {
  javascript: `// Welcome to the AST Parser Playground
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
`,
  python: `# Welcome to the AST Parser Playground
# Write or edit your Python logic here!

total_count = 10
cumulative_sum = 0

for current_val in range(1, total_count + 1):
    cumulative_sum = cumulative_sum + current_val
    print("Adding value to sum:", current_val)

def log_message(message, value):
    return message + " " + str(value)
`,
  java: `// Welcome to the AST Parser Playground
// Write or edit your Java logic here!

int totalCount = 10;
int cumulativeSum = 0;

for (int currentVal = 1; currentVal <= totalCount; currentVal++) {
    cumulativeSum = cumulativeSum + currentVal;
    System.out.println("Adding value to sum: " + currentVal);
}

public String logMessage(String message, int value) {
    return message + " " + value;
}
`,
  cpp: `// Welcome to the AST Parser Playground
// Write or edit your C++ logic here!

int totalCount = 10;
int cumulativeSum = 0;

for (int currentVal = 1; currentVal <= totalCount; currentVal++) {
    cumulativeSum = cumulativeSum + currentVal;
    std::cout << "Adding value to sum: " << currentVal << std::endl;
}

std::string logMessage(std::string message, int value) {
    return message + " " + std::to_string(value);
}
`,
  go: `// Welcome to the AST Parser Playground
// Write or edit your Go logic here!

package main
import "fmt"

func main() {
    totalCount := 10
    cumulativeSum := 0
    
    for currentVal := 1; currentVal <= totalCount; currentVal++ {
        cumulativeSum = cumulativeSum + currentVal
        fmt.Println("Adding value to sum:", currentVal)
    }
}
`,
  ruby: `# Welcome to the AST Parser Playground
# Write or edit your Ruby logic here!

total_count = 10
cumulative_sum = 0

(1..total_count).each do |current_val|
  cumulative_sum = cumulative_sum + current_val
  puts "Adding value to sum: #{current_val}"
end

def log_message(message, value)
  return "#{message} #{value}"
end
`,
  cobol: `* Welcome to the AST Parser Playground
* Write or edit your COBOL logic here!

IDENTIFICATION DIVISION.
PROGRAM-ID. EVALUATOR.
PROCEDURE DIVISION.
    DISPLAY "EVALUATE".

    EVALUATE GRADE
        WHEN 'A'
            DISPLAY "Excellent"
        WHEN 'B'
            DISPLAY "Good"
        WHEN 'C'
            DISPLAY "Average"
        WHEN OTHER
            DISPLAY "Fail"
    END-EVALUATE.

    PERFORM UNTIL CURRENT-VAL > 10
        DISPLAY "CURRENT-VAL"
    END-PERFORM.
`,
  php: `<?php
// Welcome to the AST Parser Playground
// Write or edit your PHP logic here!

$totalCount = 10;
$cumulativeSum = 0;

for ($i = 1; $i <= $totalCount; $i++) {
    $cumulativeSum = $cumulativeSum + $i;
    echo "Adding value to sum: " . $i . PHP_EOL;
}

function logMessage($message, $value) {
    return $message . " " . $value;
}
`
};

const DEFAULT_CODE_SAMPLE = LANGUAGE_SAMPLES.javascript;

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
    <div className="pl-4 border-l border-slate-200/60 my-1 font-mono text-sm">
      <div
        className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 p-0.5 rounded transition-all select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-slate-500 font-medium">{name}:</span>
        <span className="text-indigo-600 font-semibold">
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
                  <span className="text-slate-600 font-normal">{key}:</span>
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

const detectLanguage = (code) => {
  if (!code || typeof code !== "string" || !code.trim()) return "javascript";

  const trimmedCode = code.trim();
  const lowerCode = trimmedCode.toLowerCase();
  const words = trimmedCode.split(/\s+/);

  const scores = {
    javascript: 0,
    python: 0,
    java: 0,
    cpp: 0,
    go: 0,
    ruby: 0,
    cobol: 0,
    php: 0,
    sql: 0,
    html: 0,
    rust: 0,
    swift: 0,
    kotlin: 0,
    csharp: 0
  };

  // General Word Checks
  if (words.includes("int") || words.includes("double") || words.includes("float") || words.includes("char") || words.includes("void")) {
    scores.cpp += 8;
    scores.java += 8;
    scores.csharp += 8;
  }
  if (words.includes("public") || words.includes("private") || words.includes("class")) {
    scores.java += 6;
    scores.cpp += 3;
    scores.csharp += 6;
  }
  if (words.includes("def")) {
    scores.python += 8;
    scores.ruby += 8;
  }
  if (words.includes("func")) {
    scores.go += 12;
    scores.swift += 12;
  }
  if (words.includes("fn")) {
    scores.rust += 12;
  }
  if (words.includes("fun")) {
    scores.kotlin += 12;
  }
  if (words.includes("val")) {
    scores.kotlin += 6;
    scores.swift += 6;
  }
  if (words.includes("echo")) {
    scores.php += 12;
  }
  if (words.includes("DISPLAY") || words.includes("display")) {
    scores.cobol += 12;
  }
  if (words.includes("SELECT") || words.includes("select")) {
    scores.sql += 12;
  }

  // PHP
  if (trimmedCode.includes("<?php") || trimmedCode.includes("?>")) scores.php += 20;
  if (lowerCode.includes("echo ") || lowerCode.includes("php_eol")) scores.php += 5;
  if (/\$[a-zA-Z_]\w*/.test(trimmedCode)) scores.php += 4;

  // COBOL
  if (lowerCode.includes("identification division")) scores.cobol += 20;
  if (lowerCode.includes("procedure division")) scores.cobol += 20;
  if (lowerCode.includes("program-id")) scores.cobol += 15;
  if (lowerCode.includes("display \"") || lowerCode.includes("display '")) scores.cobol += 10;
  if (lowerCode.includes("end-evaluate") || lowerCode.includes("end-perform")) scores.cobol += 15;
  if (lowerCode.includes("evaluate grade") || lowerCode.includes("when other")) scores.cobol += 15;

  // C++
  if (trimmedCode.includes("#include")) scores.cpp += 20;
  if (trimmedCode.includes("std::cout") || trimmedCode.includes("std::endl")) scores.cpp += 15;
  if (trimmedCode.includes("using namespace std")) scores.cpp += 15;
  if (trimmedCode.includes("cout <<") || trimmedCode.includes("cin >>")) scores.cpp += 10;

  // Java
  if (trimmedCode.includes("public class ") || (trimmedCode.includes("class ") && trimmedCode.includes("public static void main"))) scores.java += 20;
  if (trimmedCode.includes("System.out.print")) scores.java += 15;
  if (trimmedCode.includes("import java.")) scores.java += 12;

  // Go
  if (trimmedCode.includes("package main")) scores.go += 20;
  if (trimmedCode.includes("func main()")) scores.go += 18;
  if (trimmedCode.includes("import (") && lowerCode.includes('"fmt"')) scores.go += 15;
  if (/:=/.test(trimmedCode)) scores.go += 8;

  // Python
  if (/def\s+[a-zA-Z_]\w*\s*\(.*\)\s*:/m.test(trimmedCode)) scores.python += 15;
  if (trimmedCode.includes("elif ")) scores.python += 8;
  if (trimmedCode.includes("import os") || trimmedCode.includes("import sys")) scores.python += 5;
  if (trimmedCode.includes("print(") && !trimmedCode.includes(";") && !trimmedCode.includes("{")) scores.python += 4;
  if (trimmedCode.includes("  ") && !trimmedCode.includes("{") && !trimmedCode.includes("}")) scores.python += 2;

  // Ruby
  if (/def\s+[a-zA-Z_]\w*\s*\(.*\)\s*[^\s:{]/m.test(trimmedCode) && trimmedCode.includes("end")) scores.ruby += 15;
  if (lowerCode.includes("elsif ")) scores.ruby += 10;
  if (lowerCode.includes("puts \"") || lowerCode.includes("puts '")) scores.ruby += 8;

  // SQL
  if (lowerCode.includes("select ") && lowerCode.includes("from ")) scores.sql += 15;
  if (lowerCode.includes("insert into ") || lowerCode.includes("create table ")) scores.sql += 15;
  if (lowerCode.includes("where ") || lowerCode.includes("primary key")) scores.sql += 8;

  // HTML
  if (lowerCode.includes("<!doctype html>") || lowerCode.includes("<html")) scores.html += 20;
  if (lowerCode.includes("</div>") || lowerCode.includes("</a>")) scores.html += 10;

  // Rust
  if (
    trimmedCode.includes("fn ") ||
    trimmedCode.includes("let mut ") ||
    trimmedCode.includes("println!") ||
    trimmedCode.includes("match ")
  ) {
    scores.rust += 20;
  }

  // Swift
  if (
    trimmedCode.includes("import Cocoa") ||
    trimmedCode.includes("import Foundation") ||
    trimmedCode.includes("mutating func ") ||
    (trimmedCode.includes("func ") && trimmedCode.includes("let ") && !trimmedCode.includes("{") && !trimmedCode.includes("}"))
  ) {
    scores.swift += 20;
  }

  // Kotlin
  if (
    trimmedCode.includes("fun main") ||
    (trimmedCode.includes("fun ") && trimmedCode.includes("val "))
  ) {
    scores.kotlin += 20;
  }

  // C#
  if (
    trimmedCode.includes("using System;") ||
    trimmedCode.includes("Console.WriteLine")
  ) {
    scores.csharp += 20;
  }

  // JavaScript
  if (trimmedCode.includes("const ") || trimmedCode.includes("let ") || trimmedCode.includes("var ")) {
    scores.javascript += 5;
  }
  if (trimmedCode.includes("console.log")) scores.javascript += 15;
  if (trimmedCode.includes("document.getElementById")) scores.javascript += 15;

  let maxScore = -1;
  let detected = "javascript";

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore && score > 0) {
      maxScore = score;
      detected = lang;
    }
  }

  return detected;
};

const AlgorithmPlayground = () => {
  const [activeTab, setActiveTab] = useState("ast");

  // AST State
  const [code, setCode] = useState(DEFAULT_CODE_SAMPLE);
  const [selectedStructures, setSelectedStructures] = useState(["ForStatement", "VariableDeclaration"]);
  const [language, setLanguage] = useState("javascript");
  const [dynamicLanguages, setDynamicLanguages] = useState([
    "javascript", "python", "java", "cpp", "go", "ruby", "cobol", "php", "sql", "html", "rust", "swift", "kotlin", "csharp"
  ]);
  const [astResult, setAstResult] = useState(null);

  // Plagiarism State
  const [plagiarismMode, setPlagiarismMode] = useState("single"); // "single" | "bulk"
  const [bulkFiles, setBulkFiles] = useState([]);
  const [crossPlagiarismResult, setCrossPlagiarismResult] = useState(null);
  const [docText, setDocText] = useState(DEFAULT_DOC_SAMPLE);
  const [comparisonDocs, setComparisonDocs] = useState(DEFAULT_REFS_MOCK);
  const [threshold, setThreshold] = useState(0.4);
  const [plagiarismResult, setPlagiarismResult] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocText, setNewDocText] = useState("");

  // RTK Mutations
  const [validateCodeAST, { isLoading: isASTLoading }] = useValidateCodeASTMutation();
  const [checkPlagiarismLSH, { isLoading: isPlagiarismLoading }] = useCheckPlagiarismLSHMutation();
  const [crossComparePlagiarism, { isLoading: isCrossLoading }] = useCrossComparePlagiarismMutation();

  // AST structural checklist handlers
  const handleStructureToggle = (structure) => {
    if (selectedStructures.includes(structure)) {
      setSelectedStructures(selectedStructures.filter((s) => s !== structure));
    } else {
      setSelectedStructures([...selectedStructures, structure]);
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    const detected = detectLanguage(newCode);
    if (detected !== language) {
      setLanguage(detected);
      toast.info(`Auto-detected language: ${detected.toUpperCase()}`, {
        duration: 2000,
        id: "lang-detect-toast"
      });
    }
  };

  const handleRunASTValidation = async () => {
    try {
      const detected = detectLanguage(code);
      setLanguage(detected);

      const res = await validateCodeAST({
        code,
        requiredStructures: selectedStructures,
        language: detected
      }).unwrap();

      if (res.success) {
        setAstResult(res);
        if (res.language) {
          setLanguage(res.language);
          if (!dynamicLanguages.includes(res.language)) {
            setDynamicLanguages((prev) => [...prev, res.language]);
          }
          toast.success(`AST matching language: ${res.language.toUpperCase()}`);
        } else {
          toast.success("AST generation complete!");
        }
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

  const handleBulkFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let loadedCount = 0;
    const newLoadedFiles = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newLoadedFiles.push({
          id: file.name,
          text: event.target.result,
          size: file.size
        });
        loadedCount++;
        if (loadedCount === files.length) {
          setBulkFiles((prev) => {
            const combined = [...prev];
            newLoadedFiles.forEach(nf => {
              const existingIdx = combined.findIndex(c => c.id === nf.id);
              if (existingIdx !== -1) {
                combined[existingIdx] = nf;
              } else {
                combined.push(nf);
              }
            });
            return combined;
          });
          toast.success(`Successfully uploaded ${files.length} document(s).`);
        }
      };
      reader.onerror = () => {
        toast.error(`Error reading file: ${file.name}`);
        loadedCount++;
      };
      reader.readAsText(file);
    });
    e.target.value = null;
  };

  const handleRunCrossPlagiarismCheck = async () => {
    if (bulkFiles.length < 2) {
      toast.error("Please upload at least 2 files to run cross-comparison.");
      return;
    }
    try {
      const res = await crossComparePlagiarism({
        documents: bulkFiles,
        threshold: Number(threshold)
      }).unwrap();

      if (res.success) {
        setCrossPlagiarismResult(res);
        toast.success("Cross-plagiarism check complete!");
      } else {
        toast.error(res.message || "Failed to cross-compare files.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error evaluating cross-plagiarism check.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-5xl font-extralight text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
          <FileCode className="h-9 w-9 text-indigo-600 animate-pulse shrink-0" />
          Advanced Algorithms Playground
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-lg font-extralight mt-1">
          Inspect, play with, and trigger advanced NLP and Compiler parsing algorithms compiled from our platform backend.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 mb-8 max-w-md mx-auto justify-center bg-slate-100 p-1.5 rounded-lg border">
        <button
          onClick={() => setActiveTab("ast")}
          className={`flex items-center gap-2 px-5 py-2.5 text-base font-extralight rounded-md transition-all ${
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
          className={`flex items-center gap-2 px-5 py-2.5 text-base font-extralight rounded-md transition-all ${
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
                <div className="flex items-center gap-3">
                  <span className="text-xl font-extralight text-slate-800 flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-indigo-500 shrink-0" />
                    Code Submission Editor
                  </span>
                  <select
                    value={language}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      if (newLang === "custom_add") {
                        const customName = prompt("Enter the name of the language you want to register (e.g. rust, scala, julia, haskell, swift):");
                        if (customName && customName.trim()) {
                          const formatted = customName.trim().toLowerCase();
                          if (!dynamicLanguages.includes(formatted)) {
                            setDynamicLanguages((prev) => [...prev, formatted]);
                          }
                          setLanguage(formatted);
                          setCode(LANGUAGE_SAMPLES[formatted] || `// Write your ${customName} logic here!\n`);
                        }
                      } else {
                        setLanguage(newLang);
                        setCode(LANGUAGE_SAMPLES[newLang] || "");
                      }
                    }}
                    className="text-sm border border-slate-200 bg-white rounded px-2 py-0.5 font-extralight outline-none text-slate-700 focus:border-indigo-500 cursor-pointer capitalize"
                  >
                    {dynamicLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang === "cpp" ? "C++" : lang === "cobol" ? "COBOL" : lang === "sql" ? "SQL" : lang === "html" ? "HTML" : lang === "php" ? "PHP" : lang === "csharp" ? "C#" : lang}
                      </option>
                    ))}
                    <option value="custom_add" className="text-indigo-600 font-light">+ Add Custom Language</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setCode(""); }}
                  className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-extralight"
                >
                  <RefreshCw className="h-3 w-3" />
                  Clear Editor
                </button>
              </div>
              <div className="p-4 bg-slate-950 font-mono text-base text-indigo-300">
                <textarea
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-80 bg-transparent text-indigo-200 outline-none resize-none font-mono leading-relaxed"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Checklist Selection */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
              <span className="text-3xl font-extralight text-slate-800 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-slate-500 shrink-0" />
                Required AST Structures to Validate
              </span>
              <p className="text-base font-extralight text-slate-500">
                The parser validation will verify if all selected structure nodes exist inside the abstract tree.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {AVAILABLE_STRUCTURES.map((struct) => (
                  <label
                    key={struct.value}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none text-sm font-extralight text-slate-700 transition-all"
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
                  className="w-full h-11 bg-indigo-600 text-white font-extralight text-base hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-sm rounded-lg"
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
                <span className="text-3xl font-extralight text-slate-800 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-600" />
                  AST Compiler Results
                </span>
              </div>
              <div className="p-6 space-y-4">
                {astResult ? (
                  <>
                    {/* Status Alert */}
                    {astResult.error ? (
                      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm font-extralight flex gap-3">
                        <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-light block text-base">Compilation Parsing Failed</span>
                          <p className="mt-1 font-extralight">{astResult.error}</p>
                        </div>
                      </div>
                    ) : astResult.isValid ? (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-extralight flex gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-light block text-base">AST Code Validation Passed!</span>
                          <p className="mt-1 font-extralight">All selected AST syntax components were identified successfully in the tree.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-extralight flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-light block text-base">AST Validation Failed</span>
                          <p className="mt-1 font-extralight">
                            Your code parsed correctly, but is missing one or more required syntax structures selected in the checklist.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AST Node Tree Visualizer */}
                    {astResult.ast && (
                      <div className="border border-slate-200 rounded-lg bg-slate-50 p-4 max-h-[420px] overflow-y-auto">
                        <span className="text-[11px] font-extralight text-slate-500 uppercase tracking-wider block mb-2">
                          Interactive Abstract Syntax Tree (AST)
                        </span>
                        <ASTNodeRenderer node={astResult.ast} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-base font-extralight space-y-2">
                    <Info className="h-8 w-8 text-slate-355 mx-auto" />
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
        <div className="space-y-6">
          {/* Mode Tabs Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg max-w-md border border-slate-200">
            <button
              onClick={() => setPlagiarismMode("single")}
              className={`flex-1 py-1.5 px-3 rounded text-sm font-extralight transition-all flex items-center justify-center gap-1.5 ${
                plagiarismMode === "single"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50 font-light"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Single Document vs Library
            </button>
            <button
              onClick={() => setPlagiarismMode("bulk")}
              className={`flex-1 py-1.5 px-3 rounded text-sm font-extralight transition-all flex items-center justify-center gap-1.5 ${
                plagiarismMode === "bulk"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50 font-light"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Bulk Cross-Comparison
            </button>
          </div>

          {plagiarismMode === "single" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Inputs Column (Left) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Target Document Text */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <span className="text-xl font-extralight text-slate-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-600 shrink-0" />
                      Target Document Submission
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setDocText(""); }}
                      className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-extralight"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Clear Editor
                    </button>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={docText}
                      onChange={(e) => setDocText(e.target.value)}
                      className="w-full h-36 border border-slate-200 rounded-lg p-3 text-base font-extralight text-slate-700 outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
                      placeholder="Paste or write the student submission text to compare..."
                    />
                  </div>
                </div>

                {/* Threshold Slider and Settings */}
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-extralight text-slate-800 flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-slate-500 shrink-0" />
                      Jaccard Similarity LSH Threshold
                    </span>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-extralight">
                      {(threshold * 100).toFixed(0)}% Match
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 font-extralight">0% (All Matches)</span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg outline-none"
                    />
                    <span className="text-sm text-slate-400 font-extralight">100% (Exact Only)</span>
                  </div>
                  <p className="text-sm font-extralight text-slate-500">
                    LSH clusters candidate shingle collisions. Matches equal to or exceeding the threshold will be flagged as duplicates.
                  </p>
                </div>

                {/* Reference Documents Library Manager */}
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-5">
                  <span className="text-3xl font-extralight text-slate-800 flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-indigo-500 shrink-0" />
                    Comparison Reference Library ({comparisonDocs.length} files)
                  </span>

                  {/* Reference list */}
                  <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                    {comparisonDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-200 p-3.5 rounded-lg bg-slate-50 flex items-start justify-between gap-3 text-sm font-extralight"
                      >
                        <div className="space-y-1.5">
                          <span className="text-base font-extralight text-slate-800 block">{doc.id}</span>
                          <p className="text-slate-500 font-extralight line-clamp-2 leading-relaxed">{doc.text}</p>
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
                    <span className="text-base font-extralight text-slate-700 block">Add Document to Comparison Group</span>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Document Title (e.g. Reference C)"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white outline-none focus:border-indigo-500 font-extralight"
                      />
                      <textarea
                        placeholder="Document text content to compare shingles..."
                        value={newDocText}
                        onChange={(e) => setNewDocText(e.target.value)}
                        className="w-full h-18 p-3 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white outline-none focus:border-indigo-500 resize-none font-extralight"
                      />
                      <Button
                        onClick={handleAddReferenceDoc}
                        className="w-full h-9 bg-slate-800 hover:bg-slate-900 text-white font-extralight text-base rounded-lg flex items-center justify-center gap-1.5"
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
                      className="w-full h-11 bg-indigo-600 text-white font-extralight text-base hover:bg-indigo-700 flex justify-center items-center gap-2 rounded-lg shadow-sm"
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
                    <span className="text-3xl font-extralight text-slate-800 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-slate-600 shrink-0" />
                      MinHash & LSH Results
                    </span>
                  </div>
                  <div className="p-6 space-y-4">
                    {plagiarismResult ? (
                      <>
                        <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-sm font-extralight">
                          <span className="font-light block text-base text-indigo-950 mb-1">LSH Hashing Overview</span>
                          <p className="leading-relaxed font-extralight">
                            Scanned target shingles (5-grams) against {plagiarismResult.totalCompared} files using MinHash signature hashes at threshold {(plagiarismResult.threshold * 100).toFixed(0)}%.
                          </p>
                        </div>

                        {plagiarismResult.matches && plagiarismResult.matches.length > 0 ? (
                          <div className="space-y-4">
                            <span className="text-[11px] font-extralight text-rose-500 uppercase tracking-wider block">
                              ⚠️ Plagiarism Duplication Flags
                            </span>

                            {plagiarismResult.matches.map((match) => (
                              <div
                                key={match.id}
                                className="border border-rose-200 bg-rose-50/10 p-4 rounded-lg space-y-2.5 text-sm font-extralight"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-base font-extralight text-slate-800 truncate max-w-[200px]">
                                    {match.id}
                                  </span>
                                  <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-extralight">
                                    {(match.similarity * 100).toFixed(0)}% Match
                                  </Badge>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-rose-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${match.similarity * 100}%` }}
                                  />
                                </div>
                                <p className="text-sm font-extralight text-slate-500">
                                  Estimated Jaccard similarity exceeds the threshold limit. Shingle collision flagged.
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-extralight flex gap-3">
                            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-light block text-base">No Plagiarism Matches Flagged</span>
                              <p className="mt-1 font-extralight">
                                Estimated document shingle similarity is below the set threshold across all comparison reference documents.
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-base font-extralight space-y-2">
                        <Info className="h-8 w-8 text-slate-355 mx-auto" />
                        <p>Run plagiarism checks to generate MinHash shingle signatures and LSH comparisons.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Upload box */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
                  <span className="text-xl font-extralight text-slate-800 flex items-center gap-2">
                    <UploadCloud className="h-4 w-4 text-indigo-500" />
                    Upload Documents for Cross-Plagiarism check
                  </span>

                  <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all text-center">
                    <UploadCloud className="h-8 w-8 text-slate-400" />
                    <span className="text-base font-extralight text-slate-700">Drag & drop files here, or <span className="text-indigo-600 font-light">browse</span></span>
                    <span className="text-sm text-slate-400 font-extralight">Supports .txt, .js, .py, .cpp, .html, etc. (Text based files)</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleBulkFileUpload}
                      className="hidden"
                      accept=".txt,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.h,.go,.rb,.cob,.php,.html,.css,.sql"
                    />
                  </label>

                  {/* List of uploaded files */}
                  {bulkFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm text-slate-500 font-extralight">
                        <span>Uploaded Documents ({bulkFiles.length})</span>
                        <button
                          onClick={() => setBulkFiles([])}
                          className="text-rose-500 hover:text-rose-600 transition-all font-extralight"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {bulkFiles.map((file, idx) => (
                          <div key={idx} className="border border-slate-100 p-2.5 rounded-lg bg-slate-50 flex items-center justify-between gap-3 text-sm font-extralight text-slate-700">
                            <div className="flex items-center gap-2 truncate">
                              <File className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{file.id}</span>
                              <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              onClick={() => setBulkFiles(bulkFiles.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Threshold Settings */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-extralight text-slate-800 flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-slate-500" />
                        Cross-Comparison Similarity Threshold
                      </span>
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-extralight">
                        {(threshold * 100).toFixed(0)}% Match
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400 font-extralight">0%</span>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg outline-none"
                      />
                      <span className="text-sm text-slate-400 font-extralight">100%</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleRunCrossPlagiarismCheck}
                      disabled={isCrossLoading || bulkFiles.length < 2}
                      className="w-full h-11 bg-indigo-600 text-white font-extralight text-base hover:bg-indigo-700 flex justify-center items-center gap-2 rounded-lg shadow-sm"
                    >
                      {isCrossLoading ? (
                        <>
                          <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                          Performing Cross-Comparison check...
                        </>
                      ) : (
                        <>
                          <Play className="h-4.5 w-4.5" />
                          Run Bulk Cross-Comparison
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column: Cross Plagiarism Results */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <span className="text-3xl font-extralight text-slate-800 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-slate-600 shrink-0" />
                      Cross Plagiarism Matrices
                    </span>
                  </div>
                  <div className="p-6 space-y-4">
                    {crossPlagiarismResult ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-sm font-extralight">
                          <span className="font-light block text-base text-indigo-950 mb-1">Cross-Check Overview</span>
                          <p className="leading-relaxed font-extralight">
                            Compared {bulkFiles.length} files pair-wise. Flags are triggered if similarity is &ge; {(threshold * 100).toFixed(0)}%.
                          </p>
                        </div>

                        {/* Matched Pair list */}
                        {(() => {
                          const flaggedPairs = [];
                          crossPlagiarismResult.results.forEach((res) => {
                            res.matches.forEach((match) => {
                              const pairKey = [res.id, match.id].sort().join(" <-> ");
                              if (!flaggedPairs.some(p => p.key === pairKey)) {
                                flaggedPairs.push({
                                  key: pairKey,
                                  docA: res.id,
                                  docB: match.id,
                                  similarity: match.similarity
                                });
                              }
                            });
                          });

                          if (flaggedPairs.length > 0) {
                            return (
                              <div className="space-y-3">
                                <span className="text-[11px] font-extralight text-rose-500 uppercase tracking-wider block">
                                  ⚠️ Flagged Plagiarism Connections
                                </span>
                                {flaggedPairs.map((pair, idx) => (
                                  <div
                                    key={idx}
                                    className="border border-rose-200 bg-rose-50/10 p-4 rounded-lg space-y-2.5 text-sm font-extralight"
                                  >
                                    <div className="flex justify-between items-center gap-2">
                                      <div className="truncate max-w-[220px] text-slate-800 font-extralight flex flex-col gap-0.5">
                                        <span className="truncate">{pair.docA}</span>
                                        <span className="text-[10px] text-slate-400">copied with</span>
                                        <span className="truncate">{pair.docB}</span>
                                      </div>
                                      <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-extralight shrink-0">
                                        {(pair.similarity * 100).toFixed(0)}% Match
                                      </Badge>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div
                                        className="bg-rose-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${pair.similarity * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            return (
                              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-extralight flex gap-3">
                                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="font-light block text-base">No Cross-Plagiarism Detected</span>
                                  <p className="mt-1 font-extralight">
                                    All pair-wise document comparisons scored below the similarity threshold limit.
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-base font-extralight space-y-2">
                        <Info className="h-8 w-8 text-slate-355 mx-auto" />
                        <p>Upload at least 2 documents and run bulk check to compare them against each other.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simple inline Badge component to prevent shadcn dependencies issues
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-extralight border ${className}`}>
    {children}
  </span>
);

export default AlgorithmPlayground;
