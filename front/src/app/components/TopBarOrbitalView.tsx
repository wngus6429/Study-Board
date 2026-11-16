"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Settings from "@mui/icons-material/Settings";
import {
  Avatar,
  Button,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import styles from "./style/TopBar.module.css";

import Link from "next/link";

import NotificationDropdown from "./NotificationDropdown";
import DarkModeToggle from "./DarkModeToggle";

import MessageIcon from "@mui/icons-material/Message";
import HistoryIcon from "@mui/icons-material/History";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ReportIcon from "@mui/icons-material/Report";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TranslateIcon from "@mui/icons-material/Translate";
import CheckIcon from "@mui/icons-material/Check";

import { resolveMediaUrl } from "../utils/mediaUrl";

import type { TopBarController } from "./useTopBarController";
import AppearanceMenuItem from "./AppearanceMenuItem";
export default function TopBarOrbitalView(props: TopBarController) {
  const {
    router,
    pathname,
    theme,
    isMobile,
    setCurrentPage,
    language,
    settingsMenuAnchor,
    isLoggingOut,
    topBarText,
    isAuthenticated,
    currentUser,
    userImage,
    logout,
    handleSettingsMenuOpen,
    handleSettingsMenuClose,
    handleMessages,
    handleRecentViews,
    handleScraps,
    handleBlinds,
    handleReports,
    handleLanguageChange,
  } = props;
  return (
    <div className={styles.container}>
      {/* 채널 이름과 다크모드 토글을 하나의 컨테이너로 묶음 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "10px" : "12px",
          flex: isMobile ? 1 : "unset",
        }}
      >
        <Link
          href="/channels"
          aria-label="Home"
          className={styles.title}
          onClick={() => setCurrentPage(1)}
        >
          <span className={styles.brandMark} aria-hidden="true">
            h.
          </span>
          <span>
            Hobby Channel
            <span className={styles.brandCaption}>취향으로 연결되는 공간</span>
          </span>
        </Link>

        {/* 다크모드 토글 버튼 - 채널 이름 바로 오른쪽에 위치 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            transform: isMobile ? "scale(0.85)" : "none",
            transformOrigin: "center",
            marginTop: isMobile ? "-2px" : 0,
          }}
        >
          <DarkModeToggle />
        </div>
      </div>

      <Link
        href="/channels"
        className={styles.exploreLink}
        aria-current={pathname === "/channels" ? "page" : undefined}
      >
        채널 탐색 <span aria-hidden="true">↗</span>
      </Link>
      <nav
        data-i18n-skip
        className={styles.nav}
        style={{
          gap: isMobile ? "8px" : undefined,
        }}
      >
        {/* 로그인한 사용자에게만 알림 아이콘 표시 */}
        {isAuthenticated && (
          <>
            <NotificationDropdown />
          </>
        )}

        {!isMobile && !isAuthenticated && (
          <>
            <Button variant="text" onClick={() => router.push("/login")}>
              {topBarText("로그인")}
            </Button>
            <Button variant="contained" onClick={() => router.push("/signup")}>
              {topBarText("회원가입")}{" "}
              <span aria-hidden="true" style={{ marginLeft: 10 }}>
                ↗
              </span>
            </Button>
          </>
        )}
        {!isMobile && isAuthenticated && (
          <>
            <Button variant="text" onClick={logout} disabled={isLoggingOut}>
              {topBarText(isLoggingOut ? "로그아웃 중..." : "로그아웃")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push("/setting/profile")}
            >
              {topBarText("프로필 설정")}
            </Button>
          </>
        )}
        <IconButton
          size="large"
          edge="end"
          aria-label="settings menu"
          aria-haspopup="true"
          color="inherit"
          sx={{
            color: "text.secondary",
            borderRadius: 2,
            width: 40,
            height: 40,
            border: "1px solid",
            borderColor: "divider",
            mr: 0,
          }}
          onClick={handleSettingsMenuOpen}
        >
          <Settings />
        </IconButton>

        {/* 설정 드롭다운 메뉴 */}
        <Menu
          anchorEl={settingsMenuAnchor}
          open={Boolean(settingsMenuAnchor)}
          onClose={handleSettingsMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{
            "& .MuiPaper-root": {
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              boxShadow: "0 12px 32px #00000018",
              minWidth: 220,
            },
            "& .MuiMenuItem-root": {
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              py: 1.25,
            },
          }}
        >
          <AppearanceMenuItem onSelect={handleSettingsMenuClose} />
          {currentUser && (
            <>
              <MenuItem
                onClick={() => {
                  handleSettingsMenuClose();
                  router.push("/setting/profile");
                }}
                sx={{ gap: 1 }}
              >
                <ListItemIcon>
                  <Avatar
                    src={
                      resolveMediaUrl(userImage) ?? "/assets/noprofileImage.png"
                    }
                    sx={{ width: 36, height: 36 }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={currentUser.nickname}
                  secondary={topBarText("프로필 보기")}
                />
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
            </>
          )}
          <MenuItem
            data-i18n-skip
            selected={language === "ja"}
            onClick={() => handleLanguageChange("ja")}
          >
            <ListItemIcon>
              <TranslateIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="日本語"
              secondary={language === "ja" ? "現在の表示言語" : "Japanese"}
            />
            {language === "ja" && (
              <CheckIcon fontSize="small" color="primary" />
            )}
          </MenuItem>
          <MenuItem
            data-i18n-skip
            selected={language === "ko"}
            onClick={() => handleLanguageChange("ko")}
          >
            <ListItemIcon>
              <TranslateIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="한국어"
              secondary={language === "ko" ? "현재 표시 언어" : "Korean"}
            />
            {language === "ko" && (
              <CheckIcon fontSize="small" color="primary" />
            )}
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          {isAuthenticated ? (
            <>
              <MenuItem onClick={handleMessages}>
                <ListItemIcon>
                  <MessageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("쪽지")}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleRecentViews}>
                <ListItemIcon>
                  <HistoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("최근에 봤던 게시물")}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleScraps}>
                <ListItemIcon>
                  <BookmarkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("스크랩")}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleBlinds}>
                <ListItemIcon>
                  <VisibilityOffIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("블라인드")}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleReports}>
                <ListItemIcon>
                  <ReportIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("신고 목록")}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleSettingsMenuClose();
                  logout();
                }}
                disabled={isLoggingOut}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  {topBarText(isLoggingOut ? "로그아웃 중..." : "로그아웃")}
                </ListItemText>
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem
                onClick={() => {
                  handleSettingsMenuClose();
                  router.push("/login");
                }}
              >
                <ListItemIcon>
                  <LoginIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{topBarText("로그인")}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleSettingsMenuClose();
                  router.push("/signup");
                }}
                sx={{
                  mt: 0.5,
                  borderRadius: "14px",
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(139, 92, 246, 0.35))"
                      : "linear-gradient(135deg, rgba(249, 168, 212, 0.4), rgba(129, 140, 248, 0.35))",
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(236, 72, 153, 0.45)"
                      : "1px solid rgba(99, 102, 241, 0.35)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 10px 25px rgba(15, 23, 42, 0.55)"
                      : "0 10px 25px rgba(148, 163, 184, 0.45)",
                  color: theme.palette.mode === "dark" ? "#FDF4FF" : "#1F2937",
                  position: "relative",
                  overflow: "hidden",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background:
                      theme.palette.mode === "dark"
                        ? "radial-gradient(circle at top right, rgba(255,255,255,0.25), transparent 45%)"
                        : "radial-gradient(circle at top right, rgba(255,255,255,0.55), transparent 45%)",
                    opacity: 0.8,
                    pointerEvents: "none",
                  },
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 16px 35px rgba(15, 23, 42, 0.7)"
                        : "0 16px 35px rgba(148, 163, 184, 0.55)",
                  },
                }}
              >
                <ListItemIcon>
                  <PersonAddIcon
                    fontSize="small"
                    sx={{
                      color:
                        theme.palette.mode === "dark" ? "#FEE2E2" : "#7C3AED",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={topBarText("회원가입")}
                  secondary={topBarText("30초 만에 취향 커뮤니티 합류")}
                  primaryTypographyProps={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: "inherit",
                  }}
                  secondaryTypographyProps={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color:
                      theme.palette.mode === "dark"
                        ? "rgba(248, 250, 252, 0.85)"
                        : "rgba(15, 23, 42, 0.7)",
                  }}
                />
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.25,
                    borderRadius: "999px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background:
                      theme.palette.mode === "dark"
                        ? "rgba(15, 23, 42, 0.45)"
                        : "rgba(255, 255, 255, 0.7)",
                    color:
                      theme.palette.mode === "dark" ? "#FDE68A" : "#7C3AED",
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(253, 230, 138, 0.5)"
                        : "1px solid rgba(124, 58, 237, 0.3)",
                  }}
                >
                  {topBarText("무료")}
                </Box>
              </MenuItem>
            </>
          )}
        </Menu>
      </nav>
    </div>
  );
}
