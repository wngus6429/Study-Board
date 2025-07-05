"use client";
import React, { useState, useEffect } from "react";
import { TextField, IconButton, Box, Select, MenuItem, FormControl } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";

interface SearchBarProps {
  onSearch: (searchParams: { category: string; query: string }) => void;
  onClearSearch?: () => void; // 검색 초기화 콜백 추가
  currentQuery?: string; // 현재 검색어 상태
  currentCategory?: string; // 현재 검색 카테고리 상태
}

const SEARCH_OPTIONS = [
  { label: "제목", value: "title" },
  { label: "내용", value: "content" },
  { label: "글쓴이", value: "author" },
  { label: "댓글", value: "comment" },
];

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClearSearch,
  currentQuery = "",
  currentCategory = "title",
}) => {
  const [query, setQuery] = useState(currentQuery);
  const [category, setCategory] = useState(currentCategory);
  const theme = useTheme();

  // 외부에서 전달받은 검색 상태가 변경되면 내부 상태도 업데이트
  useEffect(() => {
    setQuery(currentQuery);
    setCategory(currentCategory);
  }, [currentQuery, currentCategory]);

  // 검색 실행 함수
  const handleSearch = () => {
    onSearch({ category, query });
  };

  // 검색 초기화 함수
  const handleClearSearch = () => {
    setQuery("");
    setCategory("title");
    if (onClearSearch) {
      onClearSearch();
    }
  };

  // Enter키 입력 시 검색 실행
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "300px",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "rgba(255, 255, 255, 0.9)",
        borderRadius: 2,
        border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow:
          theme.palette.mode === "dark" ? "0 4px 15px rgba(139, 92, 246, 0.1)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
      }}
    >
      {/* 검색 범위 선택 */}
      <FormControl sx={{ minWidth: 100 }}>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "& .MuiSelect-select": {
              color: theme.palette.mode === "dark" ? "#e2e8f0" : "inherit",
            },
          }}
        >
          {SEARCH_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 검색 입력창 */}
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="검색어 입력"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              border: "none",
            },
            "& input": {
              color: theme.palette.mode === "dark" ? "#e2e8f0" : "inherit",
              "&::placeholder": {
                color: theme.palette.mode === "dark" ? "#94a3b8" : "rgba(0, 0, 0, 0.6)",
                opacity: 1,
              },
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {/* 검색어가 있을 때만 X 버튼 표시 */}
              {query && (
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    color: theme.palette.mode === "dark" ? "#ef4444" : "#dc2626",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(239, 68, 68, 0.1)" : "rgba(220, 38, 38, 0.1)",
                    },
                    padding: "4px",
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              {/* 검색 버튼 */}
              <IconButton
                onClick={handleSearch}
                sx={{
                  color: theme.palette.mode === "dark" ? "#a78bfa" : "inherit",
                  "&:hover": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <SearchIcon />
              </IconButton>
            </Box>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;
