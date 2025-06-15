/**
 * 🛡️ 로그인 상태 확인 가드 (Logged-In Guard)
 *
 * 세션 기반 인증에서 사용자의 로그인 상태를 확인하는 가드입니다.
 *
 * 주요 기능:
 * - 사용자 로그인 상태 검증
 * - 세션 인증 상태 확인
 * - 인증되지 않은 사용자 접근 차단
 *
 * 사용 용도:
 * - 세션 기반 인증이 필요한 엔드포인트에 적용
 * - JWT 가드와 별도로 사용되는 추가 보안 계층
 * - 특정 상황에서 이중 인증 체크
 *
 * @note
 * 현재 프로젝트는 주로 JWT 기반 인증을 사용하므로,
 * 이 가드는 특별한 경우나 세션 기반 인증이 필요한 경우에만 사용됩니다.
 *
 * @author Study-Board Team
 * @version 1.0.0
 */

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class LoggedInGuard implements CanActivate {
  /**
   * 사용자의 로그인 상태를 확인합니다.
   *
   * @description
   * - Request 객체에서 사용자 정보 확인
   * - 사용자 ID 존재 여부 검증
   * - 세션 인증 상태 확인
   *
   * @param context - 실행 컨텍스트 (HTTP 요청 정보 포함)
   * @returns 인증 성공 시 true, 실패 시 false
   *
   * @example
   * // 컨트롤러에서 사용 예시:
   * @UseGuards(LoggedInGuard)
   * @Get('/protected-route')
   * async protectedRoute() {
   *   // 로그인된 사용자만 접근 가능
   * }
   *
   * @security
   * - 사용자 ID가 존재하고 유효한지 확인
   * - 세션이 인증된 상태인지 확인
   * - 두 조건을 모두 만족해야 접근 허용
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // HTTP 요청 객체 추출
    const request = context.switchToHttp().getRequest();
    // return request.user?.id && request.isAuthenticated();

    // 사용자 정보 및 인증 상태 확인
    const hasUserId = request.user?.id; // 사용자 ID 존재 여부
    const isAuthenticated = request.isAuthenticated(); // 세션 인증 상태

    console.log('🛡️ 로그인 가드 검증:', {
      hasUserId: !!hasUserId,
      isAuthenticated: isAuthenticated,
      userId: hasUserId || 'N/A',
    });

    // 두 조건을 모두 만족해야 접근 허용
    const canAccess = hasUserId && isAuthenticated;

    if (!canAccess) {
      console.log('❌ 로그인 가드 - 접근 거부');
    } else {
      console.log('✅ 로그인 가드 - 접근 허용');
    }

    return canAccess;
  }
}
