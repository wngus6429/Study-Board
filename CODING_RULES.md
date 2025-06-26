# 📋 Study Board 코딩 룰 가이드

## 🎯 개요

이 문서는 Study Board 프로젝트에서 일관된 코드 품질과 스타일을 유지하기 위한 **코딩 스타일 가이드**와 **프로젝트 구조 규칙**을 정의합니다.

---

## 🏗️ 프로젝트 구조 규칙

### 📁 디렉토리 구조

```
Study-Board/
├── front/                          # 프론트엔드 (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (beforeLogin)/       # 로그인 전 페이지
│   │   │   ├── (afterLogin)/        # 로그인 후 페이지
│   │   │   ├── (noLogin)/           # 로그인 상관없는 페이지
│   │   │   ├── components/          # 공통 컴포넌트
│   │   │   │   ├── common/          # 범용 컴포넌트
│   │   │   │   ├── table/           # 테이블 컴포넌트
│   │   │   │   ├── chat/            # 채팅 컴포넌트
│   │   │   │   └── api/             # API 관련 훅
│   │   │   ├── store/               # Zustand 스토어
│   │   │   ├── api/                 # API 함수
│   │   │   ├── types/               # TypeScript 타입
│   │   │   ├── utils/               # 유틸리티 함수
│   │   │   ├── const/               # 상수 정의
│   │   │   ├── hooks/               # 커스텀 훅
│   │   │   └── theme/               # 테마 설정
│   │   └── pages/                   # NextAuth 페이지
└── back/                           # 백엔드 (NestJS)
    ├── src/
    │   ├── auth/                   # 인증 모듈
    │   ├── users/                  # 사용자 모듈
    │   ├── story/                  # 게시글 모듈
    │   ├── entities/               # 데이터베이스 엔티티
    │   └── common/                 # 공통 유틸리티
    └── upload/                     # 파일 업로드 디렉토리
```

### 🏷️ 파일 명명 규칙

#### 📄 프론트엔드 파일명

| 파일 타입           | 명명 규칙                  | 예시                                   |
| ------------------- | -------------------------- | -------------------------------------- |
| **React 컴포넌트**  | PascalCase + `.tsx`        | `UserProfile.tsx`, `NavigationBar.tsx` |
| **페이지 컴포넌트** | `page.tsx` (Next.js 규칙)  | `page.tsx`, `layout.tsx`               |
| **Zustand 스토어**  | camelCase + `Store.ts`     | `userInfoStore.ts`, `themeStore.ts`    |
| **API 함수**        | camelCase + `Api.ts`       | `channelsApi.ts`, `messagesApi.ts`     |
| **커스텀 훅**       | camelCase + `use` 접두사   | `useStories.ts`, `useBlind.ts`         |
| **유틸리티 함수**   | camelCase + `Utils.ts`     | `dateUtils.ts`, `stringUtils.ts`       |
| **타입 정의**       | camelCase + `Type.ts`      | `userType.ts`, `storyDetailType.ts`    |
| **상수 파일**       | UPPER_SNAKE_CASE           | `VIEW_COUNT.ts`, `API_ENDPOINTS.ts`    |
| **CSS 모듈**        | kebab-case + `.module.css` | `user-profile.module.css`              |

#### 📄 백엔드 파일명

| 파일 타입    | 명명 규칙                     | 예시                                        |
| ------------ | ----------------------------- | ------------------------------------------- |
| **컨트롤러** | kebab-case + `.controller.ts` | `user.controller.ts`, `story.controller.ts` |
| **서비스**   | kebab-case + `.service.ts`    | `user.service.ts`, `story.service.ts`       |
| **엔티티**   | PascalCase + `.entity.ts`     | `User.entity.ts`, `Story.entity.ts`         |
| **DTO**      | kebab-case + `.dto.ts`        | `create-user.dto.ts`, `update-story.dto.ts` |
| **모듈**     | kebab-case + `.module.ts`     | `user.module.ts`, `story.module.ts`         |

### 📂 디렉토리 명명 규칙

- **일반 디렉토리**: kebab-case 사용 (예: `user-profile/`, `channel-chat/`)
- **Next.js 라우트**: 소문자 + 하이픈 (예: `(beforeLogin)/`, `[slug]/`)
- **NestJS 모듈**: 소문자 + 하이픈 (예: `channel-chat/`, `channel-notification/`)

---

## 🎨 코딩 스타일 가이드

### 🏷️ 명명 규칙 (Naming Conventions)

#### 🔧 변수 및 함수

```typescript
// ✅ 올바른 예시
const userName = "홍길동";
const isLoggedIn = true;
const MAX_FILE_SIZE = 1024 * 1024;

function getUserInfo() {}
function handleSubmit() {}
function createStory() {}

// ❌ 잘못된 예시
const user_name = "홍길동"; // snake_case 사용 금지
const IsLoggedIn = true; // PascalCase 사용 금지
const maxFileSize = 1024 * 1024; // 상수는 UPPER_SNAKE_CASE
```

#### ⚛️ React 컴포넌트

```typescript
// ✅ 올바른 예시
interface UserProfileProps {
  userId: string;
  onUserUpdate: (user: UserType) => void;
}

export default function UserProfile({ userId, onUserUpdate }: UserProfileProps) {
  const [user, setUser] = useState<UserType | null>(null);

  const handleUserUpdate = () => {
    // 로직
  };

  return <div>{/* JSX */}</div>;
}

// ❌ 잘못된 예시
function userProfile() {} // camelCase 사용 금지
function User_Profile() {} // snake_case 사용 금지
```

#### 🎯 Boolean 변수 명명

```typescript
// ✅ 올바른 예시
const isVisible = true;
const hasError = false;
const canEdit = true;
const shouldUpdate = false;

// ❌ 잘못된 예시
const visible = true; // 의미 불분명
const error = false; // Boolean 타입 불분명
```

### 📦 Import/Export 규칙

#### 📥 Import 순서

```typescript
// ✅ 올바른 예시
import React from "react";
import { useState, useEffect } from "react";
import { Button, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { UserProfile } from "@/components/UserProfile";
import { formatDate } from "@/utils/dateUtils";
import { getUserInfo } from "@/api/userApi";

import type { UserType } from "@/types/userType";
import type { ApiResponse } from "@/types/apiType";

import styles from "./LoginForm.module.css";
```

#### 📤 Export 규칙

```typescript
// ✅ 올바른 예시 - Named Export 우선
export const formatDate = (date: Date) => { };
export const parseDate = (dateString: string) => { };

// ✅ Default Export는 컴포넌트에만 사용
export default function UserProfile() { }

// ❌ 잘못된 예시
export default const formatDate = (date: Date) => { }; // 함수는 named export
```

### 🎨 코드 포맷팅 규칙

#### 🔤 문자열 리터럴

```typescript
// ✅ 올바른 예시 - 더블 쿼트 사용
const message = "안녕하세요";
const apiUrl = "/api/users";
import styles from "./Component.module.css";

// ❌ 잘못된 예시
const message = "안녕하세요"; // 싱글 쿼트 사용 금지
```

#### 🔧 함수 선언

```typescript
// ✅ 올바른 예시 - 화살표 함수 우선
const getUserInfo = async (userId: string): Promise<UserType> => {
  // 로직
};

const handleClick = () => {
  // 로직
};

// ✅ 컴포넌트는 function 선언 사용
export default function UserProfile() {
  return <div>컴포넌트</div>;
}
```

#### 🎯 객체 및 배열

```typescript
// ✅ 올바른 예시
const user = {
  id: "user123",
  name: "홍길동",
  email: "hong@example.com",
};

const userList = [
  { id: "1", name: "홍길동" },
  { id: "2", name: "김철수" },
];

// ✅ 구조 분해 할당 사용
const { id, name, email } = user;
const [first, second] = userList;
```

### 🧩 컴포넌트 작성 규칙

#### 📋 컴포넌트 기본 구조

```typescript
"use client"; // 클라이언트 컴포넌트인 경우

import React from "react";
// ... 기타 imports

interface ComponentNameProps {
  // Props 타입 정의
  userId: string;
  onUpdate?: (data: any) => void;
}

export default function ComponentName({ userId, onUpdate }: ComponentNameProps) {
  // 1. 상태 관리
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // 2. 커스텀 훅
  const { user, updateUser } = useUserInfo(userId);

  // 3. 이벤트 핸들러
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 로직
      onUpdate?.(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 4. 조건부 렌더링
  if (loading) return <div>로딩 중...</div>;

  // 5. 메인 렌더링
  return <div className={styles.container}>{/* JSX */}</div>;
}
```

#### 🎯 Props 타입 정의

```typescript
// ✅ 올바른 예시
interface UserProfileProps {
  userId: string; // 필수 props
  showEmail?: boolean; // 선택적 props
  onUserUpdate?: (user: UserType) => void; // 이벤트 핸들러
  className?: string; // 스타일 관련
  children?: React.ReactNode; // children
}

// ❌ 잘못된 예시
interface UserProfileProps {
  userId: any; // any 타입 사용 금지
  showEmail: boolean | undefined; // ?를 사용하지 않음
}
```

### 🔄 상태 관리 규칙

#### 🏪 Zustand 스토어

```typescript
// ✅ 올바른 예시 - userInfoStore.ts
import { create } from "zustand";
import type { UserType } from "@/types/userType";

interface UserInfoState {
  user: UserType | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: UserType) => void;
  updateUser: (userData: Partial<UserType>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserInfoStore = create<UserInfoState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),
  clearUser: () => set({ user: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
```

### 📊 API 함수 규칙

#### 🌐 API 함수 명명 및 구조

```typescript
// ✅ 올바른 예시 - userApi.ts
import { apiClient } from "./axios";
import type { UserType, ApiResponse } from "@/types";

// GET 요청
export const getUserInfo = async (userId: string): Promise<UserType> => {
  const response = await apiClient.get<ApiResponse<UserType>>(`/users/${userId}`);
  return response.data.data;
};

// POST 요청
export const createUser = async (userData: Partial<UserType>): Promise<UserType> => {
  const response = await apiClient.post<ApiResponse<UserType>>("/users", userData);
  return response.data.data;
};

// PUT 요청
export const updateUser = async (userId: string, userData: Partial<UserType>): Promise<UserType> => {
  const response = await apiClient.put<ApiResponse<UserType>>(`/users/${userId}`, userData);
  return response.data.data;
};

// DELETE 요청
export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/users/${userId}`);
};
```

### 🚨 에러 처리 규칙

```typescript
// ✅ 올바른 예시
const handleSubmit = async () => {
  try {
    setLoading(true);
    const result = await createUser(userData);
    setMessage("사용자가 성공적으로 생성되었습니다.");
  } catch (error) {
    console.error("User creation failed:", error);
    setError("사용자 생성에 실패했습니다.");
  } finally {
    setLoading(false);
  }
};
```

---

## 📚 문서화 규칙

### 📝 주석 작성

```typescript
/**
 * 사용자 정보를 가져오는 함수
 * @param userId - 사용자 ID
 * @returns Promise<UserType> - 사용자 정보 객체
 */
export const getUserInfo = async (userId: string): Promise<UserType> => {
  // API 호출 전 유효성 검사
  if (!userId) {
    throw new Error("User ID is required");
  }

  // TODO: 캐싱 기능 추가 예정
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};
```

---

## 🔍 코드 리뷰 체크리스트

### ✅ 필수 확인 사항

- [ ] 파일명이 명명 규칙을 따르는가?
- [ ] 변수/함수명이 camelCase를 사용하는가?
- [ ] 컴포넌트명이 PascalCase를 사용하는가?
- [ ] Import 순서가 올바른가?
- [ ] 더블 쿼트를 사용하는가?
- [ ] 타입 정의가 명확한가?
- [ ] 에러 처리가 구현되어 있는가?

### 🎯 권장 사항

- [ ] 컴포넌트 구조가 일관적인가?
- [ ] Props 타입이 명확히 정의되어 있는가?
- [ ] 주석이 적절히 작성되어 있는가?
- [ ] 코드 재사용성을 고려했는가?

---

## 📞 문의 및 개선

이 룰에 대한 문의사항이나 개선 제안이 있으시면 개발팀에 문의해 주세요.

**마지막 업데이트**: 2024년 12월  
**버전**: 2.0.0

---

_이 문서는 프로젝트의 발전에 따라 지속적으로 업데이트됩니다._
