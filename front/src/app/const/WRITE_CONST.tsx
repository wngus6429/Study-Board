// constants.ts
import ForumIcon from "@mui/icons-material/Forum";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import InfoIcon from "@mui/icons-material/Info";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import FeedbackIcon from "@mui/icons-material/Feedback";

// 탭 선택 옵션 (게시글 작성 시 선택 가능한 옵션들)
export const WRITE_SELECT_OPTIONS = [
  { name: "잡담", value: "chat", icon: <ForumIcon /> },
  { name: "질문", value: "question", icon: <QuestionAnswerIcon /> },
  { name: "정보", value: "info", icon: <InfoIcon /> },
  { name: "리뷰", value: "review", icon: <RateReviewIcon /> },
  { name: "스샷", value: "screenshot", icon: <CameraAltIcon /> },
  { name: "기타", value: "etc", icon: <MoreHorizIcon /> },
];

export const DEFAULT_SELECT_OPTION = WRITE_SELECT_OPTIONS[0].value;

export type WRITE_SELECT_OPTION_TYPE = (typeof WRITE_SELECT_OPTIONS)[number]["value"];

// 전체 탭 옵션: '전체'와 위의 옵션들, '건의' 옵션 포함
export const TAB_SELECT_OPTIONS = [
  { name: "전체", value: "all", icon: <AllInclusiveIcon /> },
  ...WRITE_SELECT_OPTIONS,
  { name: "건의", value: "suggestion", icon: <FeedbackIcon /> },
];

export const FEEDBACK_SELECT_OPTIONS = [
  { name: "건의", value: "suggestion" },
  { name: "문의", value: "inquiry" },
  { name: "신고", value: "report" },
];

export const DEFAULT_FEEDBACK_OPTION = "suggestion";
