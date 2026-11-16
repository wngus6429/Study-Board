"use client";
import dynamic from "next/dynamic";
import { useAppearanceStore } from "@/app/store/appearanceStore";
import Classic from "./ScrollUpButtonClassic";

const Orbital = dynamic(() => import("./ScrollUpButtonOrbital"));
export default function ScrollUpButton() {
  const appearance = useAppearanceStore((state) => state.appearance);
  return appearance === "orbital" ? <Orbital /> : <Classic />;
}
