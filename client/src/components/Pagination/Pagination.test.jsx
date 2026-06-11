import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Pagination from "./Pagination";

describe("<Pagination /> Component Tests", () => {
  it("should render correct number of page buttons and Prev/Next arrows", () => {
    const handlePageChange = jest.fn();
    const { getByText } = render(
      <Pagination totalPages={5} currentPage={3} onPageChange={handlePageChange} />
    );

    expect(getByText("1")).toBeInTheDocument();
    expect(getByText("5")).toBeInTheDocument();
    expect(getByText("< Prev")).toBeInTheDocument();
    expect(getByText("Next >")).toBeInTheDocument();
  });

  it("should trigger onPageChange with correct page number when clicked", () => {
    const handlePageChange = jest.fn();
    const { getByText } = render(
      <Pagination totalPages={5} currentPage={3} onPageChange={handlePageChange} />
    );

    fireEvent.click(getByText("4"));
    expect(handlePageChange).toHaveBeenCalledWith(4);

    fireEvent.click(getByText("Next >"));
    expect(handlePageChange).toHaveBeenCalledWith(4);
  });

  it("should disable Prev arrow on first page", () => {
    const handlePageChange = jest.fn();
    const { getByText } = render(
      <Pagination totalPages={5} currentPage={1} onPageChange={handlePageChange} />
    );
    expect(getByText("< Prev").closest("button")).toBeDisabled();
  });

  it("should disable Next arrow on last page", () => {
    const handlePageChange = jest.fn();
    const { getByText } = render(
      <Pagination totalPages={5} currentPage={5} onPageChange={handlePageChange} />
    );
    expect(getByText("Next >").closest("button")).toBeDisabled();
  });
});
