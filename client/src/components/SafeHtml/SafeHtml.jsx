import React from "react";
import DOMPurify from "dompurify";

const SafeHtml = ({ content, className = "" }) => {
  const sanitized = DOMPurify.sanitize(content || "");
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export default SafeHtml;
