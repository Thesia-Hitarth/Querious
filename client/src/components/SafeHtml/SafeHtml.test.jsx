import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import SafeHtml from "./SafeHtml";

describe("<SafeHtml /> Component Tests", () => {
  it("should render clean HTML correctly", () => {
    const { container } = render(<SafeHtml content="<p>Hello World</p>" />);
    expect(container.querySelector("p")).toBeInTheDocument();
    expect(container.querySelector("p").textContent).toBe("Hello World");
  });

  it("should strip out script tags and malicious attributes", () => {
    const maliciousHtml = '<p>Safe text</p><script>alert("malicious")</script><img src="x" onerror="alert(1)" />';
    const { container } = render(<SafeHtml content={maliciousHtml} />);
    
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("p")).toBeInTheDocument();
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("onerror")).toBeNull();
  });
});
