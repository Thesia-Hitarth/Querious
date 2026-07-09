import { useEffect } from "react";

export const useDocumentMeta = ({ title, description, keywords, ogTitle, ogDescription, ogType }) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} - Querious`;
    }

    const updateMetaTag = (name, value, isProperty = false) => {
      if (!value) return;
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        if (isProperty) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
    };

    updateMetaTag("description", description || "Querious is a premium Q&A platform for programmers to learn, share knowledge, and build their careers.");
    updateMetaTag("keywords", keywords || "programming, coding, questions, developer, community, software engineering");
    updateMetaTag("og:title", ogTitle || title || "Querious");
    updateMetaTag("og:description", ogDescription || description || "Join Querious and engage with top software developers.");
    updateMetaTag("og:type", ogType || "website", true);

  }, [title, description, keywords, ogTitle, ogDescription, ogType]);
};
