"use client";
import React from "react";
import ReactPaginate from "react-paginate";
import styles from "./Pagination.module.css";

type PaginationProps = {
  pageCount: number;
  onPageChange: (selectedItem: { selected: number }) => void;
  currentPage: number;
};

const Pagination = ({ pageCount, onPageChange, currentPage }: PaginationProps) => {
  // pageCount가 0이면 페이지네이션을 렌더링하지 않음
  if (pageCount <= 0) {
    return null;
  }

  // forcePage는 0-based이므로 currentPage - 1
  // 하지만 pageCount보다 클 수 없으므로 Math.min으로 제한
  const safeForcePage = Math.min(Math.max(currentPage - 1, 0), pageCount - 1);

  return (
    <ReactPaginate
      previousLabel={"Prev"}
      nextLabel={"Next"}
      breakLabel={"..."}
      pageCount={pageCount}
      onPageChange={onPageChange}
      forcePage={safeForcePage}
      marginPagesDisplayed={2}
      pageRangeDisplayed={5}
      containerClassName={styles.pagination}
      activeClassName={styles.active}
      disabledClassName={styles.disabled}
    />
  );
};

export default Pagination;
