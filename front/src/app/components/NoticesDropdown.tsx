"use client";
import React, { useState, MouseEvent } from "react";
import { Menu, MenuItem, Divider } from "@mui/material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EditIcon from "@mui/icons-material/Edit";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface NoticeItem {
  id: number;
  title: string;
}

const NoticesDropdown = () => {
  const router = useRouter();
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

  return (
    <>
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
          transition: "transform 0.3s ease",
          position: "relative",
          zIndex: 1200,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateX(-20px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateX(0)";
        }}
      />

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
              borderRadius: "8px",
              p: 1,
              width: "500px",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 0 10px rgba(0,0,0,0.15)",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 30,
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderBottom: "8px solid white",
                transform: "translateY(-100%)",
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={handleWriteNotice}
          sx={{
            color: "#e94057",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "rgba(233, 64, 87, 0.1)",
            },
          }}
        >
          <EditIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
          공지사항 작성하기
        </MenuItem>
        <Divider />
        {isLoading ? (
          <MenuItem disabled>로딩 중...</MenuItem>
        ) : notices.length > 0 ? (
          notices.map((notice) => (
            <MenuItem key={notice.id} onClick={() => handleNoticeClick(notice.id)}>
              {notice.title}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>등록된 공지사항이 없습니다.</MenuItem>
        )}
      </Menu>
    </>
  );
};

export default NoticesDropdown;
