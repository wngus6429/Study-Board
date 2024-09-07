import { Injectable } from '@nestjs/common';
// 메서드 하나만 있는 기본적인 서비스가 있는 파일
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
