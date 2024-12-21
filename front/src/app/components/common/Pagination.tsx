"use client";
import React from "react";
import ReactPaginate from "react-paginate";

type PaginationProps = {
  pageCount: number; // 총 페이지 수
  onPageChange: (selectedItem: { selected: number }) => void; // 페이지 변경 함수
  currentPage: number; // 현재 페이지
};

const Pagination = ({ pageCount, onPageChange, currentPage }: PaginationProps) => {
  return (
    <ReactPaginate
      previousLabel={"Prev"}
      nextLabel={"Next"}
      breakLabel={"..."}
      pageCount={pageCount}
      onPageChange={onPageChange}
      forcePage={currentPage - 1} // ReactPaginate는 0-based index
      marginPagesDisplayed={2}
      pageRangeDisplayed={5}
      containerClassName={"pagination"}
      activeClassName={"active"}
      disabledClassName={"disabled"}
    />
  );
};

export default Pagination;
