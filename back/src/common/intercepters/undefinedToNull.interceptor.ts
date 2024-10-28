// AOP , 인터셉터 조사하기,
// 미들웨어랑 비슷한데, 미들웨어는 요청과 응답 사이에 실행되는 반면,
// 인터셉터는 요청이 들어오기 전과 후에 실행된다.

import { Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

// implements NestInterceptor를 해주면 반드시 구현해야하는 것이 생김
// 정확하게 구현하게 도와주는 역할이 implements
@Injectable()
export class UndefinedToNullInterceptor implements NestInterceptor {
  intercept(context, next): Observable<any> | Promise<Observable<any>> {
    // 컨트롤러 움직이기 전에는 여기다 코딩
    // 컨트롤러 움직인 다음에는 next.handle()
    return next
      .handle()
      .pipe(map((data) => (data === undefined ? null : data)));
    // 애초에 데이터가 undefined로는 못 가게 막겠다는 거지
    // data는 컨트롤러에서 리턴한 값
    // .pip(catchError) 도 있음
  }
}

// 인터셉터 데이터를 가공할때 주로 사용

// 제로초는 exception filter에서 에러같은걸 처리함
