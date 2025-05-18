// next-auth.d.ts (루트에 생성)

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      /** OAuth2 기본 필드 (name, email, image) */
      name?: string | null;
      email?: string | null;
      image?: string | null;

      /** 우리가 추가한 커스텀 필드 */
      id: string;
      user_email: string;
      nickname: string;
      link: string;
    };
  }

  interface User extends DefaultUser {
    /** authorize() 에서 리턴할 때 포함한 필드 타입 */
    id: string;
    user_email: string;
    nickname: string;
    link: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    /** jwt 콜백에 저장할 때 쓰는 필드 타입 */
    id: string;
    user_email: string;
    nickname: string;
    link: string;
  }
}
