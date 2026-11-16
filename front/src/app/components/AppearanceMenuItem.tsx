"use client";

import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import { useAppearanceStore } from "../store/appearanceStore";
import { useLanguageStore } from "../store/languageStore";

export default function AppearanceMenuItem({
  onSelect,
}: {
  onSelect: () => void;
}) {
  const { appearance, toggleAppearance } = useAppearanceStore();
  const language = useLanguageStore((state) => state.language);
  const isClassic = appearance === "classic";
  const description =
    language === "ja"
      ? isClassic
        ? "オリジナル → オービタル"
        : "オービタル → オリジナル"
      : isClassic
        ? "기본 스타일 → 오비탈 스타일"
        : "오비탈 스타일 → 기본 스타일";

  return (
    <MenuItem
      data-i18n-skip
      onClick={() => {
        onSelect();
        toggleAppearance();
      }}
    >
      <ListItemIcon>
        <PaletteOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary="テーマ変更" secondary={description} />
    </MenuItem>
  );
}
