// Next-Auth 설정
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    // 일반 DB접속 로그인 할려면 CredentialsProvider 써야함
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        // 입력한 데이터를 서버에 전달하기 위한 값들을 정의하는 부분,
        // body: JSON.stringify(credentials), 여기 credentials에 user_email, password가 들어감
        user_email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // DB에 로그인 요청
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signinSession`, {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" },
          });
          console.log("로그인 요청", res);
          if (!res.ok) return null;

          // API에서 반환된 객체 형태: { id, user_email, nickname, image, is_super_admin }
          const user = await res.json();

          // 리턴하는 객체에 **반드시** 우리가 사용할 모든 커스텀 필드를 포함시켜야 합니다.
          return {
            id: user.id,
            user_email: user.user_email,
            nickname: user.nickname,
            image: user.image, // UserImage.link
            is_super_admin: user.is_super_admin,
          };
        } catch (error) {
          console.error("로그인 실패:", error);
          return null;
        }
      },
    }),
    // Google OAuth 로그인
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Google에서 내려주는 프로필을 우리 서비스 세션 스키마에 맞게 정규화
      // 참고: https://next-auth.js.org/providers/google
      profile(profile) {
        return {
          // NextAuth 기본 필드
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // 우리 서비스에서 사용하는 커스텀 필드
          user_email: profile.email,
          nickname: profile.name || profile.email?.split("@")[0] || "GoogleUser",
          is_super_admin: false,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session: newSession }) {
      // 최초 로그인(또는 계정 연결) 시 user 객체가 존재
      if (user) {
        // Credentials 또는 OAuth 모두 동일 포맷으로 토큰 저장
        // (OAuth의 경우 위 profile()에서 커스텀 필드를 만들어둠)
        token.id = (user as any).id;
        token.user_email = (user as any).user_email ?? (user as any).email;
        token.nickname = (user as any).nickname ?? (user as any).name;
        token.image = (user as any).image as string;
        token.is_super_admin = (user as any).is_super_admin ?? false;
      }

      // 2) update() 호출 시 trigger==="update", newSession에 인자로 넘긴 객체가 들어옴
      if (trigger === "update" && newSession) {
        // update() 에서 넘겨준 키를 토큰에 덮어쓰기
        if (newSession.image !== undefined) {
          token.image = newSession.image;
        }
        if (newSession.nickname !== undefined) {
          token.nickname = newSession.nickname;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // console.log("토큰", token);
      //! sub, iat, exp, jti는 세션 객체에 포함되지 않아도됨.
      session.user.id = token.id as string;
      session.user.user_email = token.user_email as string;
      session.user.nickname = token.nickname as string;
      session.user.image = token.image as string | null;
      session.user.is_super_admin = token.is_super_admin as boolean;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 1800, // 30분
  },
};

export default NextAuth(authOptions);
// 토큰 {
//   name: undefined,
//   email: undefined,
//   picture: undefined,
//   sub: '42eb94d8-4ba3-42b2-983b-5467cd1fbb15'
// }
// 유저 {
//   id: '42eb94d8-4ba3-42b2-983b-5467cd1fbb15',
//   user_email: 'wngus6429@daum.net',
//   nickname: '한방에주님'
// }
//  POST /api/auth/callback/credentials 200 in 60ms
// 토큰 {
//   sub: '42eb94d8-4ba3-42b2-983b-5467cd1fbb15',
//   user: {
//     id: '42eb94d8-4ba3-42b2-983b-5467cd1fbb15',
//     user_email: 'wngus6429@daum.net',
//     nickname: '한방에주님'
//   },
//   iat: 1731181108,
//   exp: 1733773108,
//   jti: '952cde28-8876-4b5d-b049-f79d7ecb3673'
// }
// session {
//   user: {
//     id: '42eb94d8-4ba3-42b2-983b-5467cd1fbb15',
//     user_email: 'wngus6429@daum.net',
//     nickname: '한방에주님'
//   },
//   expires: '2024-12-09T19:38:28.979Z'
// }
