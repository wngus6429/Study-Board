"use client";
import React from "react";
import { useBlind } from "../hooks/useBlind";
import BlindedContent from "./BlindedContent";

interface BlindWrapperProps {
  userId: string;
  type: "post" | "comment";
  children: React.ReactNode;
  className?: string;
}

const BlindWrapper: React.FC<BlindWrapperProps> = ({ userId, type, children, className }) => {
  const { isUserBlinded } = useBlind();

  // 블라인드된 사용자인지 확인
  if (isUserBlinded(userId)) {
    return <BlindedContent type={type} className={className} />;
  }

  // 블라인드되지 않은 사용자의 경우 원래 컨텐츠 표시
  return <>{children}</>;
};

export default BlindWrapper;
