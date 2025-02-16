import React, { useState } from "react";
import { TextField, IconButton, Box, Select, MenuItem, FormControl } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

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
    <Box sx={{ display: "flex", alignItems: "center", width: "400px" }}>
      {/* 검색 범위 선택 */}
      <FormControl sx={{ minWidth: 120 }}>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} variant="outlined" size="small">
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
        InputProps={{
          endAdornment: (
            <IconButton onClick={handleSearch}>
              <SearchIcon />
            </IconButton>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;
