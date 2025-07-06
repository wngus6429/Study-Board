"use client";

import React from "react";
import { Box, Button, FormControl, Select, MenuItem, SelectChangeEvent, useTheme } from "@mui/material";
import { Create as CreateIcon, EmojiEvents as EmojiEventsIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Pagination from "@/app/components/common/Pagination";
import SearchBar from "@/app/components/common/SearchBar";

interface ChannelControlPanelProps {
  // 현재 상태
  currentTab: string;
  sortOrder: "recent" | "view" | "recommend";
  recommendRankingMode: boolean;
  currentPage: number;
  currentTotal: number;
  viewCount: number;
  searchParamsState: { type: string; query: string } | null;
  channelSlug: string;

  // 세션 정보
  hasSession: boolean;

  // 핸들러들
  onSortChange: (event: SelectChangeEvent<"recent" | "view" | "recommend">) => void;
  onToggleRecommendRanking: () => void;
  onPageChange: (selectedItem: { selected: number }) => void;
  onSearch: ({ category, query }: { category: string; query: string }) => void;
  onClearSearch: () => void;
}

const ChannelControlPanel: React.FC<ChannelControlPanelProps> = ({
  currentTab,
  sortOrder,
  recommendRankingMode,
  currentPage,
  currentTotal,
  viewCount,
  searchParamsState,
  channelSlug,
  hasSession,
  onSortChange,
  onToggleRecommendRanking,
  onPageChange,
  onSearch,
  onClearSearch,
}) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: "16px",
        position: "relative",
        overflow: "hidden",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(45, 48, 71, 0.95) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
        border:
          theme.palette.mode === "dark" ? "2px solid rgba(139, 92, 246, 0.25)" : "2px solid rgba(139, 92, 246, 0.15)",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 0 25px rgba(139, 92, 246, 0.2), 0 0 50px rgba(139, 92, 246, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
            : "0 0 25px rgba(139, 92, 246, 0.15), 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)"
              : "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)",
          opacity: 0.05,
          animation: "borderGlow 5s linear infinite",
          zIndex: 0,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          left: "-100%",
          width: "200%",
          height: "1px",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)"
              : "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)",
          transform: "translateY(-50%)",
          animation: "scanLine 4s ease-in-out infinite",
          zIndex: 1,
          pointerEvents: "none",
        },
        "@keyframes borderGlow": {
          "0%": {
            backgroundPosition: "0% 50%",
            filter: "hue-rotate(0deg)",
          },
          "50%": {
            backgroundPosition: "100% 50%",
            filter: "hue-rotate(180deg)",
          },
          "100%": {
            backgroundPosition: "0% 50%",
            filter: "hue-rotate(360deg)",
          },
        },
        "@keyframes scanLine": {
          "0%": { left: "-100%", opacity: 0 },
          "50%": { left: "50%", opacity: 1 },
          "100%": { left: "200%", opacity: 0 },
        },
      }}
    >
      {/* 왼쪽: 정렬 옵션과 추천 랭킹 버튼 - 건의사항 탭이 아닐 때만 표시 */}
      <Box sx={{ flex: 1, display: "flex", gap: 2, position: "relative", zIndex: 2 }}>
        {currentTab !== "suggestion" && (
          <>
            <FormControl size="small">
              <Select
                value={sortOrder}
                onChange={onSortChange}
                sx={{
                  ml: 2,
                  borderRadius: "12px",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95))",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(139, 92, 246, 0.3)"
                      : "1px solid rgba(139, 92, 246, 0.2)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 4px 15px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                      : "0 4px 15px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                  "& .MuiSelect-select": {
                    color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                    fontWeight: 600,
                    textShadow: theme.palette.mode === "dark" ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "none",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 6px 20px rgba(139, 92, 246, 0.3)"
                        : "0 6px 20px rgba(139, 92, 246, 0.15)",
                  },
                }}
              >
                <MenuItem value="recent">최신순</MenuItem>
                <MenuItem value="view">조회순</MenuItem>
                <MenuItem value="recommend">추천순</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<EmojiEventsIcon sx={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }} />}
              sx={{
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.95rem",
                position: "relative",
                overflow: "hidden",
                textTransform: "none",
                transition: "all 0.3s ease",
                background: recommendRankingMode
                  ? "linear-gradient(135deg, #ef4444, #f97316, #eab308)"
                  : "linear-gradient(135deg, #8b5cf6, #06b6d4, #22c55e)",
                color: "white",
                boxShadow: recommendRankingMode
                  ? theme.palette.mode === "dark"
                    ? "0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)"
                    : "0 0 20px rgba(239, 68, 68, 0.3), 0 6px 20px rgba(0, 0, 0, 0.1)"
                  : theme.palette.mode === "dark"
                    ? "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)"
                    : "0 0 20px rgba(139, 92, 246, 0.3), 0 6px 20px rgba(0, 0, 0, 0.1)",
                "&:hover": {
                  transform: "translateY(-3px) scale(1.02)",
                  background: recommendRankingMode
                    ? "linear-gradient(135deg, #dc2626, #ea580c, #d97706)"
                    : "linear-gradient(135deg, #7c3aed, #0891b2, #16a34a)",
                  boxShadow: recommendRankingMode
                    ? theme.palette.mode === "dark"
                      ? "0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3)"
                      : "0 0 30px rgba(239, 68, 68, 0.4), 0 10px 30px rgba(0, 0, 0, 0.15)"
                    : theme.palette.mode === "dark"
                      ? "0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3)"
                      : "0 0 30px rgba(139, 92, 246, 0.4), 0 10px 30px rgba(0, 0, 0, 0.15)",
                },
                "&:active": {
                  transform: "translateY(-1px) scale(0.98)",
                },
              }}
              onClick={onToggleRecommendRanking}
            >
              {recommendRankingMode ? "추천 랭킹 해제" : "추천 랭킹"}
            </Button>
          </>
        )}
      </Box>

      {/* 가운데: 페이지네이션 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          flex: 1,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            borderRadius: "12px",
            p: 1,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.04))"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.9))",
            border:
              theme.palette.mode === "dark"
                ? "1px solid rgba(139, 92, 246, 0.2)"
                : "1px solid rgba(139, 92, 246, 0.15)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 4px 15px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                : "0 4px 15px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
          }}
        >
          <Pagination
            pageCount={Math.ceil(currentTotal / viewCount)}
            onPageChange={onPageChange}
            currentPage={currentPage}
          />
        </Box>
      </Box>

      {/* 오른쪽: 검색바 (건의사항 탭이 아닐 때) 또는 건의하기 버튼 (건의사항 탭일 때) */}
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 2 }}>
        {currentTab === "suggestion" && hasSession ? (
          <Button
            variant="contained"
            startIcon={<CreateIcon sx={{ fontSize: 22, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }} />}
            onClick={() => router.push(`/write/suggestion?channel=${channelSlug}`)}
            sx={{
              borderRadius: "14px",
              fontWeight: 700,
              fontSize: "1rem",
              px: 3,
              py: 1.5,
              position: "relative",
              overflow: "hidden",
              textTransform: "none",
              transition: "all 0.3s ease",
              background: "linear-gradient(135deg, #8a2387, #e94057, #f27121)",
              color: "white",
              border:
                theme.palette.mode === "dark" ? "2px solid rgba(233, 64, 87, 0.5)" : "2px solid rgba(233, 64, 87, 0.3)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 25px rgba(233, 64, 87, 0.4), 0 0 50px rgba(233, 64, 87, 0.2)"
                  : "0 0 25px rgba(233, 64, 87, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1)",
              "&:hover": {
                transform: "translateY(-3px) scale(1.05)",
                background: "linear-gradient(135deg, #7a1d77, #d93a4f, #e2671e)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 0 35px rgba(233, 64, 87, 0.6), 0 0 70px rgba(233, 64, 87, 0.3)"
                    : "0 0 35px rgba(233, 64, 87, 0.4), 0 12px 40px rgba(0, 0, 0, 0.15)",
              },
              "&:active": {
                transform: "translateY(-1px) scale(1.02)",
              },
            }}
          >
            건의하기
          </Button>
        ) : (
          currentTab !== "suggestion" && (
            <Box
              sx={{
                borderRadius: "12px",
                p: 1.5,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.04))"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.9))",
                border:
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(139, 92, 246, 0.2)"
                    : "1px solid rgba(139, 92, 246, 0.15)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 15px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    : "0 4px 15px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                maxWidth: "320px",
              }}
            >
              <SearchBar
                onSearch={onSearch}
                onClearSearch={onClearSearch}
                currentQuery={searchParamsState?.query || ""}
                currentCategory={searchParamsState?.type || "title"}
              />
            </Box>
          )
        )}
      </Box>
    </Box>
  );
};

export default ChannelControlPanel;
