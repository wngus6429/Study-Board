// 미들웨어, 사용자 인증하여, 로그인 안되어 있을경우 로그인 페이지로 리다이렉트
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // 토큰을 가져와서 로그인 상태 확인
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (session == null) {
    // 로그인이 안되어 있을 경우 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 세션이 있는 경우 계속 진행
  return NextResponse.next();
}

// 미들웨어를 적용할 경로 설정
export const config = {
  matcher: ["/write", "/edit", "/setting/profile"],
};
