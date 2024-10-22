"use client";
import { Story } from "@/app/types/story";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export default function page() {
  const { id } = useParams();
  const router = useRouter(); // 삭제하고 이동시에 사용할거임
  const [detail, setDetail] = useState<Story | null>(null);

  const getDetail = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/detail/${id}`);
    setDetail(response.data);
  };

  useEffect(() => {
    getDetail();
  }, [id]);

  // TODO : comments 테이블 만들어서 엮기
  return (
    <>
      <div>{id}의 상세페이지</div>
      <div>{detail?.title}</div>
      <div>{detail?.content}</div>
      <div>{detail?.creator}</div>
      <div>{detail?.createdAt}</div>
      <div>{detail?.readCount}</div>
    </>
  );
}
