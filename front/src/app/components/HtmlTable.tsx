"use client";
import * as React from "react";
import { Story } from "../types/story";

interface CustomizedTablesProps {
  tableData: any;
}

export default function CustomizedTables({ tableData }: CustomizedTablesProps) {
  return (
    <div style={{ width: "100%", overflowX: "auto", fontSize: "14px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ width: "80px", textAlign: "center", backgroundColor: "#000", color: "#fff", padding: "8px" }}>
              게시글 번호
            </th>
            <th style={{ width: "500px", textAlign: "left", backgroundColor: "#000", color: "#fff", padding: "8px" }}>
              제목
            </th>
            <th style={{ width: "80px", backgroundColor: "#000", color: "#fff", padding: "8px" }}>작성자</th>
            <th style={{ width: "220px", backgroundColor: "#000", color: "#fff", padding: "8px" }}>등록일</th>
            <th style={{ backgroundColor: "#000", color: "#fff", padding: "8px" }}>조회수</th>
            <th style={{ width: "80px", textAlign: "center", backgroundColor: "#000", color: "#fff", padding: "8px" }}>
              추천
            </th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row: Story, index: number) => (
            <tr key={row.id} style={{ backgroundColor: index % 2 === 0 ? "#f5f5f5" : "#fff" }}>
              <td style={{ textAlign: "center", padding: "8px" }}>{row.id}</td>
              <td style={{ textAlign: "left", padding: "8px" }}>{row.title}</td>
              <td style={{ padding: "8px" }}>{row.creator}</td>
              <td style={{ padding: "8px" }}>{row.createdAt.toLocaleString()}</td>
              <td style={{ padding: "8px" }}>{row.readCount}</td>
              <td style={{ textAlign: "center", padding: "8px" }}>{row.likeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
