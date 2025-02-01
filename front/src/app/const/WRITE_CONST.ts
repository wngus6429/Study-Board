export const WRITE_SELECT_OPTIONS = [
  { name: "잡담", value: "chat" },
  { name: "질문", value: "question" },
  { name: "정보", value: "info" },
  { name: "리뷰", value: "review" },
  { name: "스샷", value: "screenshot" },
  { name: "기타", value: "etc" },
];

export const DEFAULT_SELECT_OPTION = WRITE_SELECT_OPTIONS[0]["name"];

export type WRITE_SELECT_OPTION_TYPE = (typeof WRITE_SELECT_OPTIONS)[number]["value"];

export const TAB_SELECT_OPTIONS = [
  { name: "전체", value: "all" },
  ...WRITE_SELECT_OPTIONS,
  { name: "건의", value: "suggestion" },
  { name: "건의", value: "suggestion" },
];
