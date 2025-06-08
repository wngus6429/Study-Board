"use client";
import React from "react";
import ReactPaginate from "react-paginate";
import { useTheme } from "@mui/material";

type PaginationProps = {
  pageCount: number;
  onPageChange: (selectedItem: { selected: number }) => void;
  currentPage: number;
};

const Pagination = ({ pageCount, onPageChange, currentPage }: PaginationProps) => {
  const theme = useTheme();

  return (
    <>
      <ReactPaginate
        previousLabel={"Prev"}
        nextLabel={"Next"}
        breakLabel={"..."}
        pageCount={pageCount}
        onPageChange={onPageChange}
        forcePage={currentPage - 1}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        renderOnZeroPageCount={null}
        containerClassName="pagination-container"
        pageClassName="pagination-page"
        pageLinkClassName="pagination-link"
        activeClassName="pagination-active"
        disabledClassName="pagination-disabled"
        previousClassName="pagination-previous"
        nextClassName="pagination-next"
        breakClassName="pagination-break"
      />
      <style jsx>{`
        :global(.pagination-container) {
          display: flex !important;
          list-style: none !important;
          padding: 0 !important;
          margin: 12px 0 !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 6px !important;
        }

        :global(.pagination-page),
        :global(.pagination-previous),
        :global(.pagination-next),
        :global(.pagination-break) {
          display: inline-block !important;
          list-style: none !important;
        }

        :global(.pagination-page::before),
        :global(.pagination-previous::before),
        :global(.pagination-next::before),
        :global(.pagination-break::before) {
          display: none !important;
        }

        :global(.pagination-link) {
          display: inline-flex !important;
          justify-content: center !important;
          align-items: center !important;
          padding: 8px 12px !important;
          min-width: 36px !important;
          height: 36px !important;
          text-decoration: none !important;
          color: ${theme.palette.mode === "dark" ? "#e2e8f0" : "#374151"} !important;
          font-weight: 600 !important;
          font-size: 0.875rem !important;
          border: ${theme.palette.mode === "dark"
            ? "1px solid rgba(139, 92, 246, 0.3)"
            : "1px solid #d1d5db"} !important;
          border-radius: 6px !important;
          background-color: ${theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.6)" : "#ffffff"} !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
        }

        :global(.pagination-link:hover) {
          background-color: ${theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "#f9fafb"} !important;
          border-color: ${theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#3b82f6"} !important;
          color: ${theme.palette.mode === "dark" ? "#ffffff" : "#1f2937"} !important;
        }

        :global(.pagination-active .pagination-link) {
          background-color: ${theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#3b82f6"} !important;
          color: #ffffff !important;
          border-color: ${theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#3b82f6"} !important;
          font-weight: 700 !important;
        }

        :global(.pagination-active .pagination-link:hover) {
          background-color: ${theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.9)" : "#2563eb"} !important;
        }

        :global(.pagination-disabled .pagination-link) {
          color: ${theme.palette.mode === "dark" ? "#64748b" : "#9ca3af"} !important;
          cursor: not-allowed !important;
          background-color: ${theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.3)" : "#f9fafb"} !important;
          border-color: ${theme.palette.mode === "dark" ? "rgba(100, 116, 139, 0.3)" : "#e5e7eb"} !important;
          opacity: 0.6 !important;
        }

        :global(.pagination-disabled .pagination-link:hover) {
          background-color: ${theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.3)" : "#f9fafb"} !important;
          border-color: ${theme.palette.mode === "dark" ? "rgba(100, 116, 139, 0.3)" : "#e5e7eb"} !important;
          color: ${theme.palette.mode === "dark" ? "#64748b" : "#9ca3af"} !important;
        }

        :global(.pagination-previous:not(.pagination-disabled) .pagination-link),
        :global(.pagination-next:not(.pagination-disabled) .pagination-link) {
          cursor: pointer !important;
        }

        :global(.pagination-previous:not(.pagination-disabled) .pagination-link:hover),
        :global(.pagination-next:not(.pagination-disabled) .pagination-link:hover) {
          cursor: pointer !important;
        }

        :global(.pagination-previous),
        :global(.pagination-next) {
          cursor: pointer !important;
        }

        :global(.pagination-previous:not(.pagination-disabled)),
        :global(.pagination-next:not(.pagination-disabled)) {
          cursor: pointer !important;
        }
      `}</style>
    </>
  );
};

export default Pagination;
