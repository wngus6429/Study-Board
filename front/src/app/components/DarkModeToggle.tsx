"use client";
import dynamic from "next/dynamic";
import { useAppearanceStore } from "@/app/store/appearanceStore";
import Classic from "./DarkModeToggleClassic";

const Orbital = dynamic(() => import("./DarkModeToggleOrbital"));
export default function DarkModeToggle() {
  const appearance = useAppearanceStore((state) => state.appearance);
  return appearance === "orbital" ? <Orbital /> : <Classic />;
}
