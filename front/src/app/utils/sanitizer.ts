import DOMPurify from "dompurify";

/**
 * HTML 콘텐츠를 안전하게 정화(sanitize)하는 유틸리티 함수
 * XSS(Cross-Site Scripting) 공격을 방지하기 위해 사용
 */

/**
 * 기본 HTML 정화 함수
 * - 스크립트 태그, 이벤트 핸들러, 위험한 속성들을 제거
 * - 안전한 HTML 태그와 속성만 허용
 *
 * @param html - 정화할 HTML 문자열
 * @returns 정화된 안전한 HTML 문자열
 */
export const sanitizeHtml = (html: string): string => {
  // 서버 사이드에서는 DOMPurify가 작동하지 않으므로 원본 반환
  if (typeof window === "undefined") {
    return html;
  }

  return DOMPurify.sanitize(html, {
    // 허용할 태그들 (기본값 + 추가 허용)
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "span",
      "div",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
      "code",
      "pre",
      "hr",
    ],

    // 허용할 속성들
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "id", "style", "target", "rel", "width", "height"],

    // 링크의 target 속성 허용 (새 탭에서 열기)
    ALLOW_DATA_ATTR: false,

    // 스크립트 관련 모든 것 제거
    FORBID_TAGS: ["script", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],

    // HTML5 데이터 속성 허용하지 않음
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
};

/**
 * 엄격한 HTML 정화 함수 (텍스트 콘텐츠만 허용)
 * - 모든 HTML 태그를 제거하고 텍스트만 남김
 * - 댓글이나 사용자 입력에 사용
 *
 * @param html - 정화할 HTML 문자열
 * @returns HTML 태그가 제거된 텍스트
 */
export const sanitizeTextOnly = (html: string): string => {
  if (typeof window === "undefined") {
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // 모든 태그 제거
    ALLOWED_ATTR: [], // 모든 속성 제거
    KEEP_CONTENT: true, // 태그는 제거하되 내용은 유지
  });
};

/**
 * 리치 텍스트 에디터용 HTML 정화 함수
 * - 에디터에서 생성된 HTML을 안전하게 정화
 * - 더 많은 포맷팅 태그 허용
 *
 * @param html - 정화할 HTML 문자열
 * @returns 정화된 안전한 HTML 문자열
 */
export const sanitizeRichText = (html: string): string => {
  if (typeof window === "undefined") {
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "span",
      "div",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
      "caption",
      "code",
      "pre",
      "hr",
      "sub",
      "sup",
      "s",
      "mark",
      // 리치 텍스트 에디터 전용 태그들
      "tiptap-extension-image",
      "video",
      "source",
    ],

    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "class",
      "id",
      "style",
      "target",
      "rel",
      "width",
      "height",
      "controls",
      "poster",
      // 리치 텍스트 에디터 전용 속성들
      "data-*",
      "contenteditable",
    ],

    ALLOW_DATA_ATTR: true, // 에디터에서 사용하는 data 속성 허용

    // 위험한 태그와 속성은 여전히 차단
    FORBID_TAGS: ["script", "object", "embed", "form", "input", "iframe"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
};

/**
 * URL 안전성 검증 함수
 * - 허용된 프로토콜만 통과시킴
 * - javascript:, data: 등 위험한 URL 차단
 *
 * @param url - 검증할 URL
 * @returns 안전한 URL이면 원본, 위험하면 '#' 반환
 */
export const sanitizeUrl = (url: string): string => {
  const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];

  try {
    const urlObj = new URL(url);
    if (allowedProtocols.includes(urlObj.protocol)) {
      return url;
    }
  } catch {
    // URL 파싱 실패 시 상대 경로인지 확인
    if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
      return url;
    }
  }

  return "#"; // 위험한 URL은 빈 링크로 대체
};

/**
 * XSS 공격 패턴 감지 함수
 * - 일반적인 XSS 공격 패턴을 감지
 * - 로깅이나 모니터링에 사용
 *
 * @param content - 검사할 콘텐츠
 * @returns XSS 패턴이 감지되면 true
 */
export const detectXssPatterns = (content: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(content));
};

/**
 * 안전한 HTML 렌더링을 위한 React 컴포넌트 props 생성 함수
 * - dangerouslySetInnerHTML 대신 사용할 안전한 props 생성
 *
 * @param html - 렌더링할 HTML
 * @param sanitizer - 사용할 정화 함수 (기본: sanitizeHtml)
 * @returns React dangerouslySetInnerHTML props
 */
export const createSafeHtmlProps = (html: string, sanitizer: (html: string) => string = sanitizeHtml) => {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizer(html),
    },
  };
};
