import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../entities/aUser.entity';

// @GetUser() 데코레이터를 사용하면 req.user를 가져올 수 있음
export const GetUser = createParamDecorator(
  (data, ctx: ExecutionContext): User => {
    console.log('GetUser데이터', ctx.switchToHttp().getRequest().user);
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
