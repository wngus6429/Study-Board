네, 방금 작성한 가이드를 amplify-gen2-crud-guide.md 파일로 생성했습니다!
현재 프로젝트를 Amplify Gen2로 옮기는 것에 대한 답변:
네, 기술적으로는 가능하지만 몇 가지 중요한 변경사항이 있습니다:
🔄 주요 변경사항

1. 인증 시스템 변경
   현재: NextAuth + 세션 기반
   변경후: AWS Cognito + JWT
   NextAuth 코드를 모두 Cognito로 교체해야 함
2. 데이터베이스 변경
   현재: 관계형 DB (MySQL/PostgreSQL)
   변경후: DynamoDB (NoSQL)
   테이블 구조를 NoSQL 방식으로 재설계 필요
3. API 구조 변경
   현재: REST API (/api/story/notice/${id})
   변경후: GraphQL AppSync
   모든 API 호출 코드 재작성 필요
4. 이미지 저장 방식
   현재: 서버 파일 시스템
   변경후: AWS S3
   이미지 업로드/조회 로직 변경
   ✅ 유지 가능한 부분
   Next.js + TypeScript: 그대로 유지
   Material-UI: 컴포넌트 UI는 그대로 사용 가능
   전체적인 프로젝트 구조: 폴더 구조 유지 가능
   🚀 장점
   확장성: 서버리스로 자동 확장
   실시간: GraphQL 구독으로 실시간 기능 쉽게 구현
   보안: AWS IAM 기반 권한 제어
   비용: 사용량 기반 과금
   ⚠️ 고려사항
   개발 시간: 상당한 리팩토링 필요
   학습 곡선: GraphQL, DynamoDB 학습 필요
   데이터 마이그레이션: 기존 DB 데이터 이전 작업
   결론적으로 현재 프로젝트를 Amplify Gen2로 완전히 옮기는 것은 가능하지만, 거의 새로 개발하는 수준의 작업이 필요합니다. 만약 진행하신다면 새 프로젝트로 시작해서 기능별로 단계적으로 마이그레이션하는 것을 추천드립니다.

# AWS Amplify Gen2 게시판 CRUD 구현 가이드

## 1. 프로젝트 초기 설정

### 1.1 Amplify Gen2 프로젝트 생성

```bash
npm create amplify@latest
cd your-project-name
npm install
```

### 1.2 필요한 패키지 설치

```bash
npm install @aws-amplify/ui-react aws-amplify
npm install -D @aws-amplify/backend @aws-amplify/backend-cli
```

## 2. 백엔드 스키마 정의

### 2.1 amplify/data/resource.ts

```typescript
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // 사용자 프로필
  User: a
    .model({
      id: a.id().required(),
      username: a.string().required(),
      email: a.email().required(),
      profileImage: a.url(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // 관계
      posts: a.hasMany("Post", "authorId"),
      comments: a.hasMany("Comment", "authorId"),
    })
    .authorization([a.allow.owner()]),

  // 게시글
  Post: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      content: a.string().required(),
      category: a.enum(["잡담", "한탄", "질문", "스크린샷", "공지사항"]),
      images: a.string().array(), // S3 URL 배열
      likeCount: a.integer().default(0),
      commentCount: a.integer().default(0),
      viewCount: a.integer().default(0),
      isRanking: a.boolean().default(false), // 추천 랭킹 여부
      authorId: a.id().required(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // 관계
      author: a.belongsTo("User", "authorId"),
      comments: a.hasMany("Comment", "postId"),
      likes: a.hasMany("PostLike", "postId"),
    })
    .authorization([a.allow.authenticated().to(["read"]), a.allow.owner().to(["create", "update", "delete"])]),

  // 댓글
  Comment: a
    .model({
      id: a.id().required(),
      content: a.string().required(),
      postId: a.id().required(),
      authorId: a.id().required(),
      parentId: a.id(), // 대댓글을 위한 부모 댓글 ID
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // 관계
      post: a.belongsTo("Post", "postId"),
      author: a.belongsTo("User", "authorId"),
      parent: a.belongsTo("Comment", "parentId"),
      replies: a.hasMany("Comment", "parentId"),
    })
    .authorization([a.allow.authenticated().to(["read"]), a.allow.owner().to(["create", "update", "delete"])]),

  // 게시글 좋아요
  PostLike: a
    .model({
      id: a.id().required(),
      postId: a.id().required(),
      authorId: a.id().required(),
      createdAt: a.datetime(),
      // 관계
      post: a.belongsTo("Post", "postId"),
      author: a.belongsTo("User", "authorId"),
    })
    .authorization([a.allow.authenticated().to(["read"]), a.allow.owner().to(["create", "delete"])]),

  // 채널 (추후 확장용)
  Channel: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      postCount: a.integer().default(0),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization([a.allow.authenticated().to(["read"])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
```

### 2.2 amplify/backend.ts

```typescript
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";

export const backend = defineBackend({
  auth,
  data,
  storage,
});
```

### 2.3 amplify/auth/resource.ts

```typescript
import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
```

### 2.4 amplify/storage/resource.ts (이미지 업로드용)

```typescript
import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "myProjectStorage",
  access: (allow) => ({
    "media/*": [allow.authenticated.to(["read", "write", "delete"])],
  }),
});
```

## 3. 프론트엔드 설정

### 3.1 app/amplify-utils.ts

```typescript
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

Amplify.configure(outputs);

export const client = generateClient<Schema>();
```

### 3.2 TypeScript 타입 정의

```typescript
// types/post.ts
import type { Schema } from "../amplify/data/resource";

export type Post = Schema["Post"]["type"];
export type Comment = Schema["Comment"]["type"];
export type User = Schema["User"]["type"];
export type PostLike = Schema["PostLike"]["type"];

export interface CreatePostInput {
  title: string;
  content: string;
  category: "잡담" | "한탄" | "질문" | "스크린샷" | "공지사항";
  images?: string[];
}

export interface UpdatePostInput {
  id: string;
  title?: string;
  content?: string;
  category?: "잡담" | "한탄" | "질문" | "스크린샷" | "공지사항";
  images?: string[];
}
```

## 4. CRUD 구현

### 4.1 게시글 생성 (Create)

```typescript
// hooks/usePosts.ts
import { useState } from "react";
import { client } from "../amplify-utils";
import type { CreatePostInput } from "../types/post";

export const useCreatePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (input: CreatePostInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.models.Post.create({
        title: input.title,
        content: input.content,
        category: input.category,
        images: input.images || [],
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
      });

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 작성 실패");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createPost, loading, error };
};
```

### 4.2 게시글 조회 (Read)

```typescript
// hooks/usePosts.ts
import { useState, useEffect } from "react";
import { client } from "../amplify-utils";

export const usePosts = (
  page: number = 1,
  limit: number = 10,
  category?: string,
  sortBy: "createdAt" | "likeCount" | "viewCount" = "createdAt"
) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [page, limit, category, sortBy]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = client.models.Post.list({
        limit,
        // 정렬 옵션
        ...(sortBy === "createdAt" && {
          sortDirection: "DESC",
        }),
      });

      // 카테고리 필터
      if (category && category !== "전체") {
        query = client.models.Post.list({
          filter: {
            category: { eq: category },
          },
          limit,
        });
      }

      const result = await query;

      setPosts(result.data || []);
      setHasNextPage(!!result.nextToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    error,
    hasNextPage,
    refetch: fetchPosts,
  };
};

// 단일 게시글 조회
export const usePost = (id: string) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.models.Post.get({
          id,
        });

        if (result.data) {
          // 조회수 증가
          await client.models.Post.update({
            id,
            viewCount: (result.data.viewCount || 0) + 1,
          });
        }

        setPost(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "게시글 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  return { post, loading, error };
};
```

### 4.3 게시글 수정 (Update)

```typescript
// hooks/usePosts.ts
export const useUpdatePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePost = async (input: UpdatePostInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.models.Post.update({
        id: input.id,
        ...(input.title && { title: input.title }),
        ...(input.content && { content: input.content }),
        ...(input.category && { category: input.category }),
        ...(input.images && { images: input.images }),
      });

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 수정 실패");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updatePost, loading, error };
};
```

### 4.4 게시글 삭제 (Delete)

```typescript
// hooks/usePosts.ts
export const useDeletePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePost = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // 관련 댓글들도 함께 삭제
      const comments = await client.models.Comment.list({
        filter: { postId: { eq: id } },
      });

      // 댓글 삭제
      await Promise.all(comments.data.map((comment) => client.models.Comment.delete({ id: comment.id })));

      // 좋아요 삭제
      const likes = await client.models.PostLike.list({
        filter: { postId: { eq: id } },
      });

      await Promise.all(likes.data.map((like) => client.models.PostLike.delete({ id: like.id })));

      // 게시글 삭제
      const result = await client.models.Post.delete({ id });

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 삭제 실패");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deletePost, loading, error };
};
```

## 5. 컴포넌트 구현 예시

### 5.1 게시글 작성 컴포넌트

```typescript
// components/PostForm.tsx
import React, { useState } from "react";
import { useCreatePost, useUpdatePost } from "../hooks/usePosts";
import type { Post, CreatePostInput } from "../types/post";

interface PostFormProps {
  post?: Post;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PostForm: React.FC<PostFormProps> = ({ post, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: post?.title || "",
    content: post?.content || "",
    category: post?.category || "잡담",
    images: post?.images || [],
  });

  const { createPost, loading: createLoading } = useCreatePost();
  const { updatePost, loading: updateLoading } = useUpdatePost();

  const loading = createLoading || updateLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (post?.id) {
        // 수정
        await updatePost({
          id: post.id,
          ...formData,
        });
      } else {
        // 작성
        await createPost(formData);
      }

      onSuccess?.();
    } catch (error) {
      console.error("게시글 저장 실패:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">카테고리</label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              category: e.target.value as any,
            }))
          }
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="잡담">잡담</option>
          <option value="한탄">한탄</option>
          <option value="질문">질문</option>
          <option value="스크린샷">스크린샷</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">제목</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              title: e.target.value,
            }))
          }
          className="w-full border rounded-md px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">내용</label>
        <textarea
          value={formData.content}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              content: e.target.value,
            }))
          }
          rows={10}
          className="w-full border rounded-md px-3 py-2"
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
        >
          {loading ? "저장 중..." : post ? "수정" : "작성"}
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded-md">
            취소
          </button>
        )}
      </div>
    </form>
  );
};
```

### 5.2 게시글 목록 컴포넌트

```typescript
// components/PostList.tsx
import React from "react";
import { usePosts, useDeletePost } from "../hooks/usePosts";
import { useAuthenticator } from "@aws-amplify/ui-react";

interface PostListProps {
  category?: string;
  sortBy?: "createdAt" | "likeCount" | "viewCount";
}

export const PostList: React.FC<PostListProps> = ({ category, sortBy = "createdAt" }) => {
  const { user } = useAuthenticator();
  const { posts, loading, error, refetch } = usePosts(1, 10, category, sortBy);
  const { deletePost, loading: deleteLoading } = useDeletePost();

  const handleDelete = async (postId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deletePost(postId);
      refetch();
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{post.category}</span>
                <span className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>

              <h3 className="text-lg font-semibold mb-2">{post.title}</h3>

              <p className="text-gray-600 mb-3 line-clamp-3">{post.content}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>👍 {post.likeCount}</span>
                <span>💬 {post.commentCount}</span>
                <span>👁 {post.viewCount}</span>
              </div>
            </div>

            {/* 내가 작성한 글인 경우에만 수정/삭제 버튼 표시 */}
            {user?.userId === post.authorId && (
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => {
                    /* 수정 페이지로 이동 */
                  }}
                  className="text-blue-500 hover:text-blue-700"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deleteLoading}
                  className="text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 6. 실시간 기능 추가

### 6.1 실시간 구독

```typescript
// hooks/useRealtimePosts.ts
import { useEffect, useState } from "react";
import { client } from "../amplify-utils";

export const useRealtimePosts = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // 실시간 구독 설정
    const subscription = client.models.Post.observeQuery().subscribe({
      next: ({ items, isSynced }) => {
        setPosts([...items]);
      },
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => subscription.unsubscribe();
  }, []);

  return { posts };
};
```

## 7. 이미지 업로드 구현

### 7.1 이미지 업로드 훅

```typescript
// hooks/useImageUpload.ts
import { uploadData } from "aws-amplify/storage";
import { useState } from "react";

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    setError(null);

    try {
      const key = `media/${Date.now()}-${file.name}`;

      const result = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      return result.key;
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드 실패");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, error };
};
```

## 8. 배포

```bash
# 로컬 개발
npm run dev

# 백엔드 배포
npx ampx sandbox

# 프로덕션 배포
npx ampx pipeline-deploy --branch main
```

## 9. 환경 변수 설정

```typescript
// amplify_outputs.json이 자동 생성되므로 별도 환경변수 설정 불필요
// 다만 추가 설정이 필요한 경우:

// .env.local
NEXT_PUBLIC_APP_NAME = StudyBoard;
NEXT_PUBLIC_MAX_FILE_SIZE = 5242880; // 5MB
```

## 10. 기존 프로젝트에서 Amplify Gen2로 마이그레이션 고려사항

### 10.1 주요 변경 사항

1. **데이터베이스**: 관계형 DB → DynamoDB
2. **인증**: NextAuth → AWS Cognito
3. **API**: REST API → GraphQL AppSync
4. **이미지 저장**: 기존 파일 시스템 → S3

### 10.2 마이그레이션 전략

1. **점진적 마이그레이션**: 기능별로 단계적 이전
2. **데이터 마이그레이션**: 기존 DB 데이터를 DynamoDB로 이전
3. **사용자 인증**: 기존 사용자를 Cognito로 마이그레이션
4. **UI 컴포넌트**: 기존 Material-UI 컴포넌트는 유지 가능

### 10.3 장점

- **확장성**: AWS의 서버리스 아키텍처로 자동 확장
- **실시간**: GraphQL 구독으로 실시간 기능 쉽게 구현
- **보안**: AWS IAM 기반 세밀한 권한 제어
- **비용**: 사용한 만큼만 과금

### 10.4 고려사항

- **학습 곡선**: GraphQL, DynamoDB 학습 필요
- **데이터 모델링**: NoSQL 방식으로 재설계 필요
- **기존 코드**: API 호출 부분 전면 재작성 필요

이 가이드를 따라하면 Amplify Gen2를 사용해서 완전한 CRUD 기능을 가진 게시판을 구현할 수 있습니다. GraphQL 스키마가 TypeScript 타입을 자동 생성해주므로 타입 안전성도 보장됩니다.
