"use client";
import * as React from "react";
import { Story } from "../types/story";
import style from "./HtmlTable.module.css";

interface CustomizedTablesProps {
  tableData: any;
}

export default function CustomizedTables({ tableData }: CustomizedTablesProps) {
  return (
    <div className={style.tableContainer}>
      <table className={style.table}>
        <thead>
          <tr>
            <th className={`${style.th} ${style.thCenter} ${style.thWidth80}`}>게시글 번호</th>
            <th className={`${style.th} ${style.thWidth500}`}>제목</th>
            <th className={`${style.th} ${style.thWidth80}`}>작성자</th>
            <th className={`${style.th} ${style.thWidth220}`}>등록일</th>
            <th className={style.th}>조회수</th>
            <th className={`${style.th} ${style.thCenter} ${style.thWidth80}`}>추천</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row: Story, index: number) => (
            <tr key={row.id} className={index % 2 === 0 ? style.trEven : style.trOdd}>
              <td className={`${style.td} ${style.tdCenter}`}>{row.id}</td>
              <td className={style.td}>{row.title}</td>
              <td className={style.td}>{row.creator}</td>
              <td className={style.td}>{row.createdAt.toLocaleString()}</td>
              <td className={style.td}>{row.readCount}</td>
              <td className={`${style.td} ${style.tdCenter}`}>{row.likeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
