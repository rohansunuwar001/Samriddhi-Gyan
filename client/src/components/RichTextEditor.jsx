import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const RichTextEditor = ({ value, onChange }) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create container for Quill
    const editorDiv = document.createElement("div");
    containerRef.current.appendChild(editorDiv);

    const q = new Quill(editorDiv, {
      theme: "snow",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["clean"],
        ],
      },
    });

    quillRef.current = q;

    if (value) {
      q.root.innerHTML = value;
    }

    q.on("text-change", () => {
      if (isUpdatingRef.current) return;
      const html = q.root.innerHTML;
      // If it's just an empty paragraph, send empty string
      onChange(html === "<p><br></p>" ? "" : html);
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  // Update content only when value prop changes externally (e.g. initial fetch)
  useEffect(() => {
    if (!quillRef.current) return;
    const currentHTML = quillRef.current.root.innerHTML;
    const normalizedValue = value || "";
    // Avoid cursor jumping by only updating when contents actually differ
    if (normalizedValue !== currentHTML && normalizedValue !== "<p><br></p>") {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = normalizedValue;
      isUpdatingRef.current = false;
    }
  }, [value]);

  return (
    <div ref={containerRef} className="border border-[#6a6f73] focus-within:border-[#1c1d1f] transition-colors" />
  );
};

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default RichTextEditor;