// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import { cookies } from "next/headers";
import cookie from "cookie";
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
          const authResponse = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signin`, {
            user_email: credentials?.user_email,
            password: credentials?.password,
          });
          const setCookie = authResponse.headers["set-cookie"];
          if (setCookie) {
            const parsed = cookie.parse(setCookie[0]);
            const accessToken = parsed["access_token"];
            console.log("parsed access token:", accessToken);
            if (accessToken) {
              // JWT 토큰 반환
              console.log("악세스", accessToken);
              return { accessToken };
            }
          }
          // let setCookie = authResponse.headers.get("Set-Cookie");
          // console.log("set-cookie", setCookie);
          // if (setCookie) {
          //   const parsed = cookie.parse(setCookie);
          //   cookies().set("connect.sid", parsed["connect.sid"], parsed);
          //   // 브라우저에 쿠키를 심어주는 것
          //   // 프론트서버에는 쿠키를 심으면 안된다. 서버는 공용이기 때문에 심으면 개인정보 유출 발생
          // }
          // 'set-cookie' 헤더가 존재하는지 확인
          // if (setCookieHeader && setCookieHeader.length > 0) {
          //   const parsed = cookie.parse(setCookieHeader[0]);
          //   cookies().set("connect.sid", parsed["connect.sid"], parsed);
          // }
          // let setCookie = authResponse.headers.get("Set-Cookie");
          // console.log("set-cookie", setCookie);
          // if (setCookie) {
          //   const parsed = cookie.parse(setCookie);
          //   cookies().set("connect.sid", parsed["connect.sid"], parsed);
          //   // 브라우저에 쿠키를 심어주는 것
          //   // 프론트서버에는 쿠키를 심으면 안된다. 서버는 공용이기 때문에 심으면 개인정보 유출 발생
          // }
          const user = authResponse.data;
          if (authResponse.status === 200 && user) {
            return user; // 사용자 객체 반환
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
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    },
  },
  // callbacks: {
  //   jwt({ token }) {
  //     // console.log("auth.ts jwt", token);
  //     return token;
  //   },
  //   session({ session, newSession, user }) {
  //     // console.log("auth.ts session", session, newSession, user);
  //     return session;
  //   },
  // },
  secret: "process.env.NEXTAUTH_SECRET",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    // encryption: false, // JWT를 암호화하지 않도록 설정
  },
});
