"use client";
import React, { useState, MouseEvent } from "react";
import { Menu, MenuItem, Divider, Typography, Box, Chip, Badge } from "@mui/material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EditIcon from "@mui/icons-material/Edit";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import axios from "axios";

interface NoticeItem {
  id: number;
  title: string;
  created_at: string;
}

const NoticesDropdown = () => {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // 공지사항 데이터 가져오기
  const { data: noticesData, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/notices?limit=10`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5분간 캐시
    gcTime: 1000 * 60 * 10, // 10분간 가비지 컬렉션 방지
  });

  const notices: NoticeItem[] = noticesData?.results || [];

  const handleOpen = (event: MouseEvent<HTMLImageElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNoticeClick = (id: number) => {
    router.push(`/notice/${id}`);
    handleClose();
  };

  const handleWriteNotice = () => {
    router.push("/write/notice");
    handleClose();
  };

  // 새 공지사항 여부 확인 (3일 이내)
  const isNewNotice = (createdAt: string) => {
    const noticeDate = new Date(createdAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return noticeDate > threeDaysAgo;
  };

  // 제목 길이 제한
  const truncateTitle = (title: string, maxLength: number = 35) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  return (
    <>
      <Badge
        badgeContent={notices.length}
        color="error"
        sx={{
          "& .MuiBadge-badge": {
            right: 8,
            top: 8,
            border: `2px solid ${theme.palette.background.paper}`,
            padding: "0 4px",
            fontSize: "0.75rem",
            fontWeight: "bold",
          },
        }}
      >
        <Image
          src="/assets/공지사항.png"
          alt="필독! 공지사항"
          width={180}
          height={60}
          onClick={handleOpen}
          style={{
            cursor: "pointer",
            marginLeft: "8px",
            marginRight: "8px",
            transition: "transform 0.3s ease, filter 0.3s ease",
            position: "relative",
            zIndex: 1200,
            filter: isDarkMode ? "brightness(1.1) contrast(1.1)" : "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateX(-20px) scale(1.02)";
            e.currentTarget.style.filter = isDarkMode ? "brightness(1.3) contrast(1.2)" : "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateX(0) scale(1)";
            e.currentTarget.style.filter = isDarkMode ? "brightness(1.1) contrast(1.1)" : "none";
          }}
        />
      </Badge>

      {/* ✅ 공지사항 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              p: 0,
              width: "520px",
              maxHeight: "500px",
              backgroundColor: isDarkMode ? "rgba(30, 32, 38, 0.98)" : "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(12px)",
              boxShadow: isDarkMode
                ? "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.2)"
                : "0 20px 40px rgba(0, 0, 0, 0.15), 0 0 20px rgba(233, 64, 87, 0.1)",
              border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.05)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 30,
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: isDarkMode ? "10px solid rgba(30, 32, 38, 0.98)" : "10px solid rgba(255, 255, 255, 0.98)",
                transform: "translateY(-100%)",
                zIndex: 1,
              },
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #8a2387, #e94057, #f27121)",
              },
            },
          },
        }}
      >
        {/* 헤더 섹션 */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: isDarkMode ? "#ffffff" : "#1a1a2e",
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <AnnouncementIcon sx={{ color: "#e94057" }} />
            공지사항
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
              fontSize: "0.875rem",
            }}
          >
            최신 공지사항을 확인하세요
          </Typography>
        </Box>

        {/* 공지사항 작성 버튼 */}
        <Box sx={{ px: 2, pb: 2 }}>
          <MenuItem
            onClick={handleWriteNotice}
            sx={{
              borderRadius: "12px",
              p: 2,
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(233, 64, 87, 0.1), rgba(242, 113, 33, 0.1))"
                : "linear-gradient(135deg, rgba(233, 64, 87, 0.05), rgba(242, 113, 33, 0.05))",
              border: isDarkMode ? "1px solid rgba(233, 64, 87, 0.3)" : "1px solid rgba(233, 64, 87, 0.2)",
              color: "#e94057",
              fontWeight: "600",
              fontSize: "0.95rem",
              transition: "all 0.3s ease",
              "&:hover": {
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(233, 64, 87, 0.2), rgba(242, 113, 33, 0.2))"
                  : "linear-gradient(135deg, rgba(233, 64, 87, 0.1), rgba(242, 113, 33, 0.1))",
                transform: "translateY(-2px)",
                boxShadow: isDarkMode ? "0 8px 25px rgba(233, 64, 87, 0.3)" : "0 8px 25px rgba(233, 64, 87, 0.2)",
              },
            }}
          >
            <EditIcon sx={{ mr: 1.5, fontSize: "1.3rem" }} />새 공지사항 작성하기
          </MenuItem>
        </Box>

        <Divider
          sx={{
            mx: 2,
            mb: 1,
            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
          }}
        />

        {/* 공지사항 목록 */}
        <Box sx={{ px: 2, pb: 2, maxHeight: "300px", overflowY: "auto" }}>
          {isLoading ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                  fontStyle: "italic",
                }}
              >
                공지사항을 불러오는 중...
              </Typography>
            </Box>
          ) : notices.length > 0 ? (
            notices.map((notice, index) => (
              <MenuItem
                key={notice.id}
                onClick={() => handleNoticeClick(notice.id)}
                sx={{
                  borderRadius: "10px",
                  p: 2,
                  mb: 1,
                  backgroundColor: isDarkMode ? "rgba(45, 48, 56, 0.6)" : "rgba(249, 250, 251, 0.8)",
                  border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "rgba(55, 58, 66, 0.8)" : "rgba(233, 64, 87, 0.05)",
                    transform: "translateX(8px)",
                    boxShadow: isDarkMode ? "0 4px 15px rgba(0, 0, 0, 0.3)" : "0 4px 15px rgba(0, 0, 0, 0.1)",
                    borderColor: isDarkMode ? "rgba(139, 92, 246, 0.3)" : "rgba(233, 64, 87, 0.2)",
                  },
                  "&:last-child": {
                    mb: 0,
                  },
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: isDarkMode ? "#ffffff" : "#1a1a2e",
                        fontSize: "0.95rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {truncateTitle(notice.title)}
                    </Typography>
                    {isNewNotice(notice.created_at) && (
                      <Chip
                        icon={<FiberNewIcon sx={{ fontSize: "0.8rem" }} />}
                        label="NEW"
                        size="small"
                        sx={{
                          height: "22px",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          backgroundColor: "#e94057",
                          color: "white",
                          "& .MuiChip-icon": {
                            color: "white",
                          },
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {new Date(notice.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <AnnouncementIcon
                sx={{
                  fontSize: "3rem",
                  color: isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
                  mb: 2,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                  fontStyle: "italic",
                }}
              >
                등록된 공지사항이 없습니다
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NoticesDropdown;
