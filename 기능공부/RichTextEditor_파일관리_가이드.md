# 📝 RichTextEditor 파일 관리 시스템 가이드

> **간단 요약**: 게시글 작성/수정 시 이미지와 동영상을 어떻게 똑똑하게 관리하는지 설명하는 문서입니다.

## 📋 목차

1. [🎯 뭘 하는 시스템인가요?](#뭘-하는-시스템인가요)
2. [🔄 어떻게 동작하나요?](#어떻게-동작하나요)
3. [💻 프론트엔드에서는?](#프론트엔드에서는)
4. [⚙️ 백엔드에서는?](#백엔드에서는)
5. [🐛 문제가 생겼을 때](#문제가-생겼을-때)
6. [⚡ 더 빠르게 만들기](#더-빠르게-만들기)

---

## 🎯 뭘 하는 시스템인가요?

### 🌟 핵심 기능

- **📝 글 쓰기**: 이미지, 동영상을 드래그 앤 드롭으로 쉽게 첨부
- **✏️ 글 수정**: 기존 파일은 그대로 두고 새 파일만 추가
- **🧹 자동 정리**: 안 쓰는 파일은 알아서 삭제
- **💾 메모리 절약**: 임시 파일들이 메모리를 계속 차지하지 않음

### 🤔 왜 복잡한가요?

| 문제 상황                    | 우리의 해결법                              |
| ---------------------------- | ------------------------------------------ |
| **임시 파일 vs 진짜 파일**   | 임시로 보여주다가 나중에 진짜 저장         |
| **똑같은 파일 여러 번 저장** | 글 내용을 분석해서 실제 사용하는 것만 보관 |
| **메모리 부족**              | 5분 후 임시 파일 자동 삭제                 |
| **여러 명이 동시에 수정**    | 안전한 순서로 처리                         |

---

## 🔄 어떻게 동작하나요?

### 📱 간단한 흐름

```
1. 사용자가 이미지 드래그 → 2. 바로 에디터에 표시 → 3. 글 저장 버튼 클릭
→ 4. 서버에 파일 업로드 → 5. 임시 주소를 진짜 주소로 바꿈 → 6. 완료!
```

### 🔍 단계별 자세히

**📝 새 글 쓸 때**:

1. 이미지 선택 → 임시로 보여줌 → 저장할 때 서버에 업로드 → 완료

**✏️ 글 수정할 때**:

1. 기존 글 불러옴 → 새 이미지 추가 → 안 쓰는 옛날 이미지 삭제 → 저장

**👀 글 볼 때**:

1. 서버에서 글 내용 가져옴 → 이미지 경로를 실제 주소로 바꿈 → 화면에 표시

---

## 💻 프론트엔드에서는?

### 🖼️ 이미지 업로드 버튼

**뭘 하나요?**

- 사용자가 이미지 선택하면 바로 에디터에 보여줍니다
- 너무 큰 파일(100MB 초과)은 거절합니다
- 여러 장 동시 선택 가능합니다

**핵심 코드 (간단 버전)**:

````typescript
// 이미지 버튼 클릭하면 실행되는 함수
const handleImageUpload = () => {
  // 1. 파일 선택 창 열기
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true; // 여러 장 선택 가능

  input.onchange = (e) => {
    const files = Array.from(e.target.files || []);

    // 2. 파일 크기 체크 (100MB 제한)
    const tooBig = files.filter(f => f.size > 100 * 1024 * 1024);
    if (tooBig.length > 0) {
      alert("100MB 넘는 파일이 있어요!");
      return;
    }

    // 3. 임시 주소 만들어서 에디터에 표시
    files.forEach(file => {
      const tempUrl = URL.createObjectURL(file);
      editor.insertImage(tempUrl); // 에디터에 이미지 삽입

      // 5분 후 메모리에서 삭제 (메모리 절약)
      setTimeout(() => URL.revokeObjectURL(tempUrl), 5 * 60 * 1000);
    });
  };

  input.click(); // 파일 선택 창 열기
};

### 🎬 동영상 업로드 버튼

**뭘 하나요?**
- 동영상 파일을 선택해서 에디터에 넣습니다
- 1GB 넘는 파일은 거절합니다
- 동영상은 한 번에 1개만 선택 가능합니다

**핵심 코드**:
```typescript
const handleVideoUpload = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "video/*";

  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1GB 제한
    if (file.size > 1024 * 1024 * 1024) {
      alert("동영상은 1GB까지만 가능해요!");
      return;
    }

    // 임시 주소로 동영상 플레이어 만들기
    const tempUrl = URL.createObjectURL(file);
    const videoHtml = `
      <video controls style="max-width:100%;">
        <source src="${tempUrl}" type="${file.type}" />
      </video>
      <p>🎬 ${file.name}</p>
    `;

    editor.insertContent(videoHtml);

    // 5분 후 메모리 정리
    setTimeout(() => URL.revokeObjectURL(tempUrl), 5 * 60 * 1000);
  };

  input.click();
};
### 📝 새 글 작성할 때

**뭘 하나요?**
- 제목, 내용, 파일들을 모아서 서버로 보냅니다
- 에디터에 있는 임시 이미지들은 실제 파일과 함께 전송됩니다

**핵심 코드**:
```typescript
const handleSubmit = (e) => {
  e.preventDefault();

  // 폼 데이터 만들기
  const formData = new FormData();
  formData.append("title", title);           // 제목
  formData.append("content", content);       // 내용 (임시 주소 포함)
  formData.append("category", category);     // 카테고리

  // 에디터에서 선택한 파일들 추가
  editorFiles.forEach(file => {
    formData.append("files", file);  // 실제 파일들
  });

  // 서버로 전송
  createStory.mutate(formData);
};
````

> **💡 포인트**: 내용에는 임시 주소(`blob:...`)가 들어있고, 실제 파일은 따로 보내서 서버에서 매칭시킵니다!

### ✏️ 글 수정할 때

#### 🔍 기존 파일 불러오기

**뭘 하나요?**

- 서버에서 글을 불러올 때 저장된 이미지 경로를 실제 주소로 바꿔줍니다
- 사용자가 에디터에서 기존 이미지를 볼 수 있게 합니다

**간단한 설명**:

```typescript
// 글 수정 페이지에서 기존 글 불러올 때
useEffect(() => {
  if (storyDetail) {
    let content = storyDetail.content;
    const baseUrl = "http://localhost:9999"; // 서버 주소

    // 기존 이미지들을 하나씩 처리
    storyDetail.StoryImage?.forEach((imageInfo) => {
      // 저장된 경로: /upload/image_20241201.jpg
      // 실제 주소: http://localhost:9999/upload/image_20241201.jpg

      content = content.replace(`/upload/${imageInfo.image_name}`, `${baseUrl}/upload/${imageInfo.image_name}`);
    });

    setContent(content); // 에디터에 표시
  }
}, [storyDetail]);
```

> **💡 포인트**: 데이터베이스에는 `/upload/image.jpg` 형태로 저장되어 있지만, 실제로 보여줄 때는 `http://localhost:9999/upload/image.jpg` 로 바꿔줘야 합니다!

#### 💾 수정 내용 저장하기

**뭘 하나요?**

- 저장할 때는 다시 상대 경로로 바꿔서 저장합니다
- 새로 추가한 파일들도 함께 서버로 보냅니다

**간단한 설명**:

```typescript
const handleUpdate = (e) => {
  let contentToSave = content;
  const baseUrl = "http://localhost:9999";

  // 1. 절대 경로를 다시 상대 경로로 변환
  // http://localhost:9999/upload/image.jpg → /upload/image.jpg
  contentToSave = contentToSave.replace(new RegExp(`${baseUrl}/upload/`, "g"), "/upload/");

  // 2. 임시 주소들은 빈 문자열로 (서버에서 새 파일로 교체됨)
  contentToSave = contentToSave.replace(/src="blob:[^"]*"/g, 'src=""');

  // 3. 폼 데이터 만들기
  const formData = new FormData();
  formData.append("content", contentToSave);

  // 4. 새로 추가한 파일들 첨부
  editorFiles.forEach((file) => {
    formData.append("files", file);
  });

  // 5. 서버로 전송
  updateStory.mutate(formData);
};
```

> **💡 포인트**: 화면에서 볼 때는 절대 주소(`http://...`)를 사용하지만, 저장할 때는 상대 주소(`/upload/...`)로 바꿔서 저장합니다!

---

## ⚙️ 백엔드에서는?

### 📝 새 글 저장하기

**뭘 하나요?**

- 프론트엔드에서 받은 글 내용과 파일들을 처리합니다
- 임시 주소(`blob:...`)를 실제 파일 경로로 바꿉니다
- 파일 정보를 데이터베이스에 저장합니다

**간단한 설명**:

```typescript
// 새 글 저장 API
async create(title, content, files) {
  let finalContent = content;

  // 1. 업로드된 파일들을 처리
  if (files && files.length > 0) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const videoFiles = files.filter(f => f.type.startsWith('video/'));

    // 2. 임시 주소를 실제 파일 경로로 바꾸기
    [...imageFiles, ...videoFiles].forEach(file => {
      const isImage = file.type.startsWith('image/');
      const path = isImage ? '/upload/' : '/videoUpload/';

      // src="blob:..." → src="/upload/filename.jpg"
      finalContent = finalContent.replace(
        /src="blob:[^"]*"/,  // 첫 번째 blob 주소 찾기
        `src="${path}${file.filename}"`  // 실제 경로로 교체
      );
    });

    // 3. 파일 정보를 데이터베이스에 저장
    await this.saveFileInfo(story, imageFiles, videoFiles);
  }

  // 4. 최종 글 저장
  story.content = finalContent;
  return await this.save(story);
}
```

> **💡 포인트**: 임시 주소 `blob:http://localhost/abc123`를 실제 주소 `/upload/image_20241201.jpg`로 하나씩 바꿔줍니다!

````

### ✏️ 글 수정하기 - 똑똑한 파일 관리

**뭘 하나요?**
- 수정된 글 내용을 분석해서 어떤 파일이 실제로 사용되는지 확인합니다
- 안 쓰는 옛날 파일들은 삭제하고, 새 파일들은 추가합니다

**간단한 설명**:
```typescript
async updateStory(storyId, content, newFiles) {
  // 1. 기존 글과 파일 정보 가져오기
  const story = await this.findStory(storyId);

  // 2. 글 내용을 분석해서 실제 사용되는 파일 찾기
  const usedImages = this.findUsedFiles(content, '/upload/');
  const usedVideos = this.findUsedFiles(content, '/videoUpload/');

  // 3. 안 쓰는 파일들 찾기
  const imagesToDelete = story.images.filter(img =>
    !usedImages.includes(img.filename)
  );
  const videosToDelete = story.videos.filter(video =>
    !usedVideos.includes(video.filename)
  );

  console.log('삭제할 파일들:', imagesToDelete.length + videosToDelete.length);

  // 4. 안 쓰는 파일들 삭제 (하드디스크 + 데이터베이스)
  await this.deleteFiles(imagesToDelete, videosToDelete);

  // 5. 새 파일들 추가
  let updatedContent = await this.addNewFiles(content, newFiles);

  // 6. 최종 저장
  story.content = updatedContent;
  return await this.save(story);
}
````

> **💡 핵심**: 글 내용을 읽어서 `src="/upload/image.jpg"` 같은 패턴을 찾아 실제 사용되는 파일만 남기고 나머지는 삭제합니다!

---

## 🐛 문제가 생겼을 때

### 😱 자주 생기는 문제들

#### 1️⃣ 이미지가 엑박(❌)으로 나와요!

**원인**: 이미지 경로가 잘못되었거나 파일이 없어졌어요

**해결법**:

```typescript
// 브라우저 개발자 도구에서 확인
console.log("글 내용:", content);
console.log("이미지 파일들:", storyImages);

// 실제 파일이 있는지 확인
// http://localhost:9999/upload/파일명.jpg 를 브라우저에서 직접 접속해보세요
```

#### 2️⃣ 글 수정하면 기존 이미지가 사라져요!

**원인**: 파일 분석 로직에서 실수로 사용 중인 파일을 안 쓰는 걸로 판단했어요

**해결법**:

```typescript
// 사용되는 파일 확인
const usedFiles = content.match(/src="[^"]*\/upload\/([^"]+)"/g);
console.log("실제 사용되는 파일들:", usedFiles);
console.log("삭제 예정 파일들:", filesToDelete);
```

#### 3️⃣ 새 파일이 저장 안 돼요!

**원인**: 임시 주소(`blob:...`)를 실제 주소로 바꾸는 과정에서 문제 발생

**해결법**:

```typescript
// 빈 src 태그 개수 확인
const emptySrc = (content.match(/src=""/g) || []).length;
console.log("빈 src 개수:", emptySrc);
console.log("새 파일 개수:", newFiles.length);
// 둘이 같아야 정상!
```

### 🔍 문제 해결 체크리스트

문제가 생겼을 때 이 순서로 확인해보세요:

- [ ] 브라우저 개발자 도구 → Console 탭에서 에러 메시지 확인
- [ ] Network 탭에서 파일 업로드가 성공했는지 확인 (200 OK?)
- [ ] 서버 폴더(`back/upload/`, `back/videoUpload/`)에 파일이 실제로 있는지 확인
- [ ] 데이터베이스 `StoryImage`, `StoryVideo` 테이블에 정보가 저장되었는지 확인
- [ ] 글 내용에서 `src="/upload/..."` 경로가 올바른지 확인

---

## ⚡ 더 빠르게 만들기

### 🚀 간단한 최적화 방법들

#### 1️⃣ 이미지 크기 줄이기

```typescript
// 너무 큰 이미지는 자동으로 크기 조절
const resizeImage = (file) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    // 최대 1920px로 제한
    const maxWidth = 1920;
    const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);

    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // 80% 품질로 압축
    canvas.toBlob(callback, "image/jpeg", 0.8);
  };
};
```

#### 2️⃣ 파일 개수 제한

```typescript
const MAX_FILES = 10; // 최대 10개까지만
if (uploadedFiles.length + newFiles.length > MAX_FILES) {
  alert(`최대 ${MAX_FILES}개까지만 업로드할 수 있어요!`);
  return;
}
```

#### 3️⃣ 메모리 자동 정리

```typescript
// 5분마다 오래된 임시 파일들 정리
setInterval(() => {
  oldBlobUrls.forEach((url) => {
    URL.revokeObjectURL(url); // 메모리에서 제거
  });
}, 5 * 60 * 1000);
```

---

## 🎉 마무리

### 🌟 이 시스템이 특별한 이유

이 파일 관리 시스템은 단순히 "파일 업로드"가 아니라 **똑똑한 파일 관리**를 합니다:

1. **🧠 똑똑한 분석**: 글 내용을 읽어서 실제 사용되는 파일만 보관
2. **💾 메모리 절약**: 임시 파일들이 메모리를 계속 차지하지 않음
3. **🔄 자동 정리**: 안 쓰는 파일은 알아서 삭제
4. **⚡ 빠른 표시**: 이미지를 선택하면 바로 에디터에 나타남

### 📊 실제 효과

- **스토리지 절약**: 중복 파일, 안 쓰는 파일 자동 제거
- **메모리 효율**: 5분 후 임시 파일 자동 해제로 브라우저 메모리 절약
- **사용자 경험**: 드래그 앤 드롭으로 직관적인 파일 업로드
- **개발자 편의**: 파일 관리를 신경 쓸 필요 없음

### 🤔 만약 처음부터 만든다면?

이런 시스템을 혼자서 처음부터 만들려면:

- **개발 기간**: 최소 3-4주 (풀타임 기준)
- **난이도**: ⭐⭐⭐⭐⭐ (고급)
- **필요 지식**:
  - JavaScript Blob API
  - 정규식 패턴 매칭
  - React Hook 최적화
  - NestJS 파일 처리
  - 데이터베이스 트랜잭션

**결론**: AI 도움 없이는 상당히 어려운 프로젝트입니다! 🚀

### 💡 핵심 포인트 요약

1. **임시 주소 → 실제 주소**: `blob:...` → `/upload/file.jpg`
2. **글 내용 분석**: 실제 사용되는 파일만 남기기
3. **메모리 관리**: 5분 후 자동 정리
4. **경로 변환**: 저장할 때는 상대 경로, 보여줄 때는 절대 경로

> **💬 한 줄 요약**: 사용자는 그냥 드래그 앤 드롭하면 되고, 나머지는 시스템이 알아서 처리해주는 똑똑한 파일 관리 시스템입니다!
