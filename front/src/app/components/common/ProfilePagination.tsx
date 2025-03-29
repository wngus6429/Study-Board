"use client";
import React from "react";
import ReactPaginate from "react-paginate";
import styles from "./Pagination.module.css";

type PaginationProps = {
  pageCount: number;
  onPageChange: (selectedItem: { selected: number }) => void;
  currentPage: number;
};

const ProfilePagination = ({ pageCount, onPageChange, currentPage }: PaginationProps) => {
  return (
    <ReactPaginate
      previousLabel={"Prev"}
      nextLabel={"Next"}
      breakLabel={"..."}
      pageCount={pageCount}
      onPageChange={onPageChange}
      forcePage={currentPage - 1}
      // marginPagesDisplayed를 줄이고, pageRangeDisplayed도 조절
      marginPagesDisplayed={0}
      pageRangeDisplayed={4}
      containerClassName={styles.pagination}
      activeClassName={styles.active}
      disabledClassName={styles.disabled}
    />
  );
};

export default ProfilePagination;
