// src/types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // 추가된 id 속성
      nickname: string; // 추가된 nickname 속성
      user_email: string; // 추가된 user_email 속성
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}