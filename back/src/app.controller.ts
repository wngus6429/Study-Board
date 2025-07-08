import { Controller, Get } from '@nestjs/common';

// 라우트 하나만 있는 기본적인 컨트롤러가 있는 파일
@Controller('/story')
export class AppController {
  @Get('/health')
  healthCheck() {
    return { status: 'ok씨발' };
  }
}
