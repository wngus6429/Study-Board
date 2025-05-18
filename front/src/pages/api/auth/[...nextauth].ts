// Next-Auth 설정
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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

          // API에서 반환된 객체 형태: { id, user_email, nickname, image }
          const user = await res.json();

          // 리턴하는 객체에 **반드시** 우리가 사용할 모든 커스텀 필드를 포함시켜야 합니다.
          return {
            id: user.id,
            user_email: user.user_email,
            nickname: user.nickname,
            image: user.image, // UserImage.link
          };
        } catch (error) {
          console.error("로그인 실패:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    //! 맨아래 로그 참조
    async jwt({ token, user, trigger, session: newSession }) {
      // if (user) {
      //   // console.log("토큰", token);
      //   // console.log("유저", user);
      //   // 로그인 성공 시 사용자 데이터를 토큰에 저장
      //   token.user = user;
      // }
      // return token;
      if (user) {
        token.id = user.id;
        token.user_email = user.user_email;
        token.nickname = user.nickname;
        token.image = user.image as string;
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
      // session.user = token.user as typeof session.user;
      // // console.log("session", session);
      // return session;
      session.user.id = token.id as string;
      session.user.user_email = token.user_email as string;
      session.user.nickname = token.nickname as string;
      session.user.image = token.image as string | null;
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
