"use client";
import React, { useState } from "react";
import { TextField, IconButton, Box, Select, MenuItem, FormControl } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@mui/material/styles";

interface SearchBarProps {
  onSearch: (searchParams: { category: string; query: string }) => void;
}

const SEARCH_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "제목/내용", value: "title_content" },
  { label: "제목", value: "title" },
  { label: "내용", value: "content" },
  { label: "글쓴이", value: "author" },
  { label: "댓글", value: "comment" },
];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all"); // 기본값: 전체 검색
  const theme = useTheme();

  // 검색 실행 함수
  const handleSearch = () => {
    onSearch({ category, query });
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
        width: "400px",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "rgba(255, 255, 255, 0.9)",
        borderRadius: 2,
        border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow:
          theme.palette.mode === "dark" ? "0 4px 15px rgba(139, 92, 246, 0.1)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
      }}
    >
      {/* 검색 범위 선택 */}
      <FormControl sx={{ minWidth: 120 }}>
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
        placeholder="검색어를 입력하세요."
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
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;
