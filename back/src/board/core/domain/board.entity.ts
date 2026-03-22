export class Board {
  constructor(
    public readonly id: number | null,
    public title: string,
    public content: string,
    public category: string,
    public readonly authorId: string,
    public viewCount: number,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  // 도메인 규칙 (예: 조회수 증가, 제목 변경 등)은 여기서 순수 함수로 구현합니다.
  
  incrementViewCount() {
    this.viewCount += 1;
  }

  updateContent(title: string, content: string) {
    if (!title || title.trim() === '') {
      throw new Error('제목은 필수입니다.');
    }
    this.title = title;
    this.content = content;
    this.updatedAt = new Date();
  }
}
