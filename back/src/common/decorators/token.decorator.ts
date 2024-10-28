import { createParamDecorator } from '@nestjs/common';

// @Token() token 이런식으로 사용하면 req.token을 가져올 수 있음
// 중복을 줄이는 효과가 있음
// ! 중요: 이 데코레이터는 JWT 토큰을 가져오는 역할을 합니다.
// ! 아직 사용되지 않음
export const Token = createParamDecorator((data, ctx) => {
  const response = ctx.switchToHttp().getRequest();
  return response.locals.jwt;
});
