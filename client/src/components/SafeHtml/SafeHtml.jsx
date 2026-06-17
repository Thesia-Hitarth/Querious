import React, { useState } from "react";
import DOMPurify from "dompurify";
import { useToast } from "../Toast/ToastContext";

const CodeBlock = ({ codeText }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      showToast("Code copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code text:", err);
      showToast("Failed to copy code block", "error");
    }
  };

  return (
    <pre style={{ position: "relative" }}>
      <code>{codeText}</code>
      <button type="button" onClick={handleCopy} className="code-copy-btn">
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </pre>
  );
};

const domToReact = (node, index = 0) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tagName = node.tagName.toLowerCase();

  // If pre tag contains code, render the CodeBlock component
  if (tagName === "pre") {
    const codeNode = node.querySelector("code");
    if (codeNode) {
      return <CodeBlock key={index} codeText={codeNode.innerText} />;
    }
  }

  // Convert attributes
  const attrs = { key: index };
  for (let i = 0; i < node.attributes.length; i++) {
    const { name, value } = node.attributes[i];
    let reactName = name;
    if (name === "class") reactName = "className";
    else if (name === "for") reactName = "htmlFor";
    else if (name.startsWith("on")) continue; // strip script events
    
    attrs[reactName] = value;
  }

  // Recursively process children
  const children = Array.from(node.childNodes).map((child, idx) =>
    domToReact(child, idx)
  );

  return React.createElement(tagName, attrs, ...children);
};

const SafeHtml = ({ content, className = "" }) => {
  // Use DOMPurify sanitize first
  const sanitized = DOMPurify.sanitize(content || "");
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${sanitized}</div>`, "text/html");
  const rootElement = doc.body.firstChild;

  return (
    <div className={className}>
      {Array.from(rootElement.childNodes).map((child, idx) =>
        domToReact(child, idx)
      )}
    </div>
  );
};

export default SafeHtml;
