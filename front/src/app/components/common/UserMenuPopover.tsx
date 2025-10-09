import React from "react";
import { Popover, List, ListItem, ListItemIcon, ListItemText, Divider, Typography, Box } from "@mui/material";
import { Person as PersonIcon, Mail as MailIcon } from "@mui/icons-material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useRouter } from "next/navigation";

interface UserMenuPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  nickname: string;
  onSendMessage: () => void;
  onBlindUser?: () => void; // 선택: 블라인드 액션
}

const UserMenuPopover: React.FC<UserMenuPopoverProps> = ({
  open,
  anchorEl,
  onClose,
  nickname,
  onSendMessage,
  onBlindUser,
}) => {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push(`/profile/${encodeURIComponent(nickname)}`);
    onClose();
  };

  const handleSendMessageClick = () => {
    onSendMessage();
    onClose();
  };

  const handleBlindClick = () => {
    if (onBlindUser) {
      onBlindUser();
    }
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      PaperProps={{
        sx: {
          borderRadius: 1,
          minWidth: 120,
          maxWidth: 150,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <Box sx={{ px: 1.5, py: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {nickname}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ py: 0.5 }}>
        <ListItem
          onClick={handleProfileClick}
          sx={{
            "&:hover": {
              backgroundColor: "action.hover",
            },
            cursor: "pointer",
            py: 0.5,
            px: 1,
            minHeight: 32,
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="프로필 보기"
            primaryTypographyProps={{
              variant: "body2",
              fontSize: "0.8rem",
            }}
          />
        </ListItem>
        {/* 블라인드 하기 */}
        {onBlindUser && (
          <ListItem
            onClick={handleBlindClick}
            sx={{
              "&:hover": {
                backgroundColor: "action.hover",
              },
              cursor: "pointer",
              py: 0.5,
              px: 1,
              minHeight: 32,
            }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <VisibilityOffIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="블라인드 하기"
              primaryTypographyProps={{
                variant: "body2",
                fontSize: "0.8rem",
              }}
            />
          </ListItem>
        )}
        <ListItem
          onClick={handleSendMessageClick}
          sx={{
            "&:hover": {
              backgroundColor: "action.hover",
            },
            cursor: "pointer",
            py: 0.5,
            px: 1,
            minHeight: 32,
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <MailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="쪽지 보내기"
            primaryTypographyProps={{
              variant: "body2",
              fontSize: "0.8rem",
            }}
          />
        </ListItem>
      </List>
    </Popover>
  );
};

export default UserMenuPopover;
