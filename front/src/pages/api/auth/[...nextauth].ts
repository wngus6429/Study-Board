// Next-Auth 설정
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
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
          if (res.ok) {
            return res.json();
          }
          return null;
        } catch (error) {
          console.error("로그인 실패:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    //! 맨아래 로그 참조
    async jwt({ token, user }) {
      if (user) {
        // console.log("토큰", token);
        // console.log("유저", user);
        // 로그인 성공 시 사용자 데이터를 토큰에 저장
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      // console.log("토큰", token);
      //! sub, iat, exp, jti는 세션 객체에 포함되지 않아도됨.
      session.user = token.user as typeof session.user;
      // console.log("session", session);
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});
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
