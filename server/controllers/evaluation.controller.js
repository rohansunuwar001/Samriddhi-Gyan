import { parseCodeToAST, validateAST } from "../utils/astValidator.js";
import { detectLanguageWithGemini } from "../utils/geminiClient.js";
import { checkPlagiarism } from "../utils/plagiarismChecker.js";

const DEFAULT_REFERENCE_DOCS = [
  {
    id: "Ref-1: Node.js Overview",
    text: "Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser. It is built on the Chrome V8 engine and uses an event-driven, non-blocking I/O model."
  },
  {
    id: "Ref-2: React Library basics",
    text: "React is a free and open-source front-end JavaScript library for building user interfaces based on components. It is maintained by Meta and a community of individual developers and companies."
  },
  {
    id: "Ref-3: React State Management",
    text: "State management in React can be handled with the useState hook for local state, or Redux Toolkit for complex global state. Using state correctly ensures that components render efficiently."
  },
  {
    id: "Ref-4: Web API concept",
    text: "An API, or Application Programming Interface, is a set of rules that allows different software applications to communicate with each other. It defines the requests that can be made, how to make them, and the expected responses."
  }
];

export const validateCodeAST = async (req, res) => {
  try {
    const { code, requiredStructures, language } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        message: "Code string is required."
      });
    }

    const structures = Array.isArray(requiredStructures) ? requiredStructures : [];

    let detectedLanguage = language || "javascript";
    try {
      const geminiLang = await detectLanguageWithGemini(code);
      if (geminiLang) {
        detectedLanguage = geminiLang;
      }
    } catch (err) {
      console.warn("Gemini language detection failed, fallback used:", err.message);
    }

    let ast = null;
    let parseError = null;

    try {
      ast = parseCodeToAST(code, detectedLanguage);
    } catch (err) {
      parseError = err.message;
    }

    if (parseError) {
      return res.status(200).json({
        success: true,
        isValid: false,
        ast: null,
        language: detectedLanguage,
        error: `Syntax Parsing Error: ${parseError}`
      });
    }

    const isValid = validateAST(ast, structures);

    return res.status(200).json({
      success: true,
      isValid,
      ast,
      language: detectedLanguage,
      error: null
    });
  } catch (error) {
    console.error("validateCodeAST error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during AST evaluation."
    });
  }
};

export const checkPlagiarismLSH = async (req, res) => {
  try {
    const { docText, referenceDocs, threshold } = req.body;

    if (!docText || typeof docText !== "string" || !docText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Target document text is required."
      });
    }

    const checkThreshold = typeof threshold === "number" ? threshold : 0.5;

    const comparisonDocs = Array.isArray(referenceDocs) && referenceDocs.length > 0
      ? referenceDocs.map((doc, idx) => ({
          id: doc.id || `Custom-Doc-${idx + 1}`,
          text: doc.text || ""
        }))
      : DEFAULT_REFERENCE_DOCS;

    const matches = checkPlagiarism(docText, comparisonDocs, checkThreshold);

    return res.status(200).json({
      success: true,
      matches,
      threshold: checkThreshold,
      totalCompared: comparisonDocs.length
    });
  } catch (error) {
    console.error("checkPlagiarismLSH error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during LSH plagiarism evaluation."
    });
  }
};

export const crossComparePlagiarism = async (req, res) => {
  try {
    const { documents, threshold } = req.body;

    if (!Array.isArray(documents) || documents.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 documents are required for cross-comparison."
      });
    }

    const checkThreshold = typeof threshold === "number" ? threshold : 0.5;
    const results = [];

    for (let i = 0; i < documents.length; i++) {
      const docA = documents[i];
      const otherDocs = documents
        .filter((_, idx) => idx !== i)
        .map(d => ({ id: d.id, text: d.text }));

      const matches = checkPlagiarism(docA.text, otherDocs, checkThreshold);

      results.push({
        id: docA.id,
        matches
      });
    }

    return res.status(200).json({
      success: true,
      results,
      threshold: checkThreshold
    });
  } catch (error) {
    console.error("crossComparePlagiarism error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during cross-plagiarism comparison."
    });
  }
};
