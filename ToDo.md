1. 회원가입시 쿠키주고 바로 로그인 완료시키고, 홈 화면으로 이동 (완료)
2. 로그인, 회원가입 버튼 추가 (완료)
3. 삭제 기능 구현 (완료)
4. 삭제시 내가 쓴 글만 가능하게 추가
5. 회원 가입, 로그인 후 Alert 화면 표시
6. 로그아웃 구현하기
7. 맨 오른쪽에 추천하기 버튼, 로그인 해서 내꺼면 삭제 혹은 수정 버튼
8. 삭제 시 로딩표시
9. Next-Auth 해야함 (완료)
10. refresh-token 이게 뭐임
    https://www.inflearn.com/community/questions/1291603/%EC%84%9C%EB%B2%84-%EB%A1%9C%EA%B7%B8%EC%9D%B8-%EB%B0%A9%EC%8B%9D%EA%B3%BC-%EA%B2%B0%ED%95%A9?srsltid=AfmBOorFPvfwaxD9Y-oRMTKVZikGZpp-_O5SuxRnwsYEZcGedTIVKUer
11. 유저 클릭시. 다양한 버튼 표시는 popover
12. 삭제 하시겠습니까? 이거 modal
13. 질문 삭제 못하게 막기
14. 글 작성할때, select로 잡단, 한탄, 질문, 스크린샷 등등 탭 만들기
15. 회원 가입후 바로 로그인 안됨. DB에서 access_Token은 받는데. 세션에 안 담김
16. 페이지 만들어야함
17. 유저이미지 등록 및 표시
18. 업로드 및 상세페이지 사진 표시 (디자인 변경필요)

-- 기능 구현()
프론트 - NextJS, Mui, 상태관리(Zustand)
백엔드 - NestJS(TypeORM),
DB - MySQL,

1. 회원가입 기능
2. 로그인 기능
3. Next-Auth 프론트 세션인증, 백엔드에서 JWT 쿠키 http-only
4. 게시글 작성
5. 게시글 작성시 등록 버튼 로딩기능
6. 로그인 유저만 게시글 보이게
7. 로그인시 로그인, 회원가입 버튼 안 보이게
8. 상세 화면 기능 만듬, 그러나 개선중 (ToDo)
9. 삭제 기능
10. 게시글 표시기능
11. 탭 표시기능 (만드는중)
12. 글 작성시 카테고리, 타이틀, 내용, 사진 업로드

class-validator로 엔티티 설정하기
https://github.com/typestack/class-validator
아주 좋은게 많다. 꼭 보기 UUID 부터해서 싹다 있다.
