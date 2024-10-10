"use client";
import { useParams } from "next/navigation";

export default function page() {
  const { id } = useParams();
  return (
    <>
      <div>{id}의 상세페이지</div>
    </>
  );
}
