# S3 이미지 업로드 마이그레이션 가이드

본 문서는 로컬 디스크(`upload/`, `userUpload/` 등)에 저장하던 이미지/동영상 파일을 AWS S3로 업로드하도록 변경한 내용을 정리합니다.

## 1. 새로 추가된 의존성

`back/package.json`

```json
"@aws-sdk/client-s3": "^3.474.0",
"multer-s3": "^3.0.1"
```

> `npm i` 혹은 `yarn` 으로 패키지를 설치해 주세요.

## 2. 공통 S3 설정 헬퍼 추가

`back/src/common/config/multerS3.config.ts`

- `multer-s3` + `@aws-sdk/client-s3` 를 사용해 **버킷, 폴더 prefix** 만 넘기면 곧바로 S3 업로드가 가능하도록 `createMulterS3Options` 헬퍼를 제공했습니다.
- 환경 변수
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_S3_BUCKET`
    를 `.env` 혹은 EC2 시스템 환경 변수에 지정해 주세요.

## 3. Multer 설정을 S3 로 교체한 모듈

| 모듈               | 변경 전                        | 변경 후                                      |
| ------------------ | ------------------------------ | -------------------------------------------- |
| `AuthModule`       | `diskStorage('./userUpload')`  | `createMulterS3Options('user-profile')`      |
| `StoryModule`      | 로컬 `upload/`, `videoUpload/` | `createMulterS3Options('story-assets')`      |
| `ChannelsModule`   | 로컬 `channelUpload/`          | `createMulterS3Options('channel-images')`    |
| `SuggestionModule` | 로컬 `suggestionUpload/`       | `createMulterS3Options('suggestion-images')` |

## 4. 서비스 레이어 변경

- 파일 링크 저장 방식이 **로컬 경로** → **S3 퍼블릭 URL** 로 변경되었습니다.
- 변경된 위치
  - `auth.service.ts` – 프로필 이미지 `link`
  - `story.service.ts` – 이미지/동영상 `link` (다수 위치)
  - `storyTransaction.ts` – 이미지/동영상 `link`
  - `channels.service.ts` – 채널 대표 이미지 `link`
  - `suggestion.service.ts` – 건의사항 이미지 `link`

> 모두 `file.location` (multer-s3 가 반환하는 전체 URL) 을 저장하도록 수정되었습니다.

## 5. 미처리 항목 / TODO

1. **삭제 로직** – S3 객체를 지우도록 수정 필요 (`suggestion.service.ts` 등 기존 `fs.unlinkSync` 사용 부분).
2. **DB 마이그레이션** – 이미 업로드된 로컬 경로를 S3 URL 로 변환하려면 별도 배치가 필요합니다.
3. **정적 파일 서빙** – `main.ts` 의 `app.useStaticAssets()` 구문은 로컬 개발 환경에서만 사용하도록 분기 처리할 수 있습니다.

## 6. 배포 시 필요 환경 변수

```
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=★
AWS_SECRET_ACCESS_KEY=★
AWS_S3_BUCKET=study-board-assets
```

EC2 의 **IAM Role** 에 S3 접근 권한을 부여하면 Access Key/Secret 없이도 동작할 수 있습니다.

---

이상입니다. 추가 질문이 있으면 언제든 말씀 주세요! :)
