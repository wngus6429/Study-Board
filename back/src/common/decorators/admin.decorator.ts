import { SetMetadata } from '@nestjs/common';
import { AdminLevel } from '../../auth/admin.guard';

/**
 * 관리자 권한 필수 데코레이터
 *
 * @description
 * - 특정 엔드포인트에 관리자 권한을 요구할 때 사용
 * - AdminGuard와 함께 사용하여 권한 체크 수행
 * - 총 관리자와 채널 관리자 권한을 구분하여 설정 가능
 *
 * @param adminLevel 필요한 관리자 권한 레벨
 *
 * @usage
 * ```typescript
 * @UseGuards(AdminGuard)
 * @AdminRequired(AdminLevel.SUPER_ADMIN)
 * async deleteAllPosts() {
 *   // 총 관리자만 접근 가능
 * }
 *
 * @UseGuards(AdminGuard)
 * @AdminRequired(AdminLevel.CHANNEL_ADMIN)
 * async deleteChannelPost(@Param('channelId') channelId: string) {
 *   // 채널 관리자 또는 총 관리자 접근 가능
 * }
 * ```
 */
export const AdminRequired = (adminLevel: AdminLevel) =>
  SetMetadata('adminLevel', adminLevel);

/**
 * 총 관리자 권한 필수 데코레이터
 *
 * @description
 * - 총 관리자 권한이 필요한 엔드포인트에 사용
 * - AdminRequired(AdminLevel.SUPER_ADMIN)의 단축 버전
 *
 * @usage
 * ```typescript
 * @UseGuards(AdminGuard)
 * @SuperAdminRequired()
 * async deleteUser(@Param('id') id: string) {
 *   // 총 관리자만 접근 가능
 * }
 * ```
 */
export const SuperAdminRequired = () => AdminRequired(AdminLevel.SUPER_ADMIN);

/**
 * 채널 관리자 권한 필수 데코레이터
 *
 * @description
 * - 채널 관리자 권한이 필요한 엔드포인트에 사용
 * - AdminRequired(AdminLevel.CHANNEL_ADMIN)의 단축 버전
 * - 해당 채널의 생성자이거나 총 관리자인 경우 접근 가능
 *
 * @usage
 * ```typescript
 * @UseGuards(AdminGuard)
 * @ChannelAdminRequired()
 * async deleteChannelPost(@Param('channelId') channelId: string) {
 *   // 채널 관리자 또는 총 관리자 접근 가능
 * }
 * ```
 */
export const ChannelAdminRequired = () =>
  AdminRequired(AdminLevel.CHANNEL_ADMIN);
