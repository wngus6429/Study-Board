"use client";
import React, { useState, MouseEvent } from "react";
import { Menu, MenuItem } from "@mui/material";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface NoticeItem {
  id: number;
  title: string;
}

const NOTICE_ITEMS: NoticeItem[] = [
  { id: 1, title: "새로운 기능 업데이트 안내" },
  { id: 2, title: "서비스 점검 예정 공지" },
  { id: 3, title: "이벤트 당첨자 발표" },
  { id: 4, title: "[필독] 커뮤니티 이용 규칙" },
];

const NoticesDropdown = () => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
        {NOTICE_ITEMS.map((notice) => (
          <MenuItem key={notice.id} onClick={() => handleNoticeClick(notice.id)}>
            {notice.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default NoticesDropdown;
