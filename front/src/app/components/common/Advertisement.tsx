"use client";
import dynamic from "next/dynamic";
import { useAppearanceStore } from "@/app/store/appearanceStore";
import Classic from "./AdvertisementClassic";

const Orbital = dynamic(() => import("./AdvertisementOrbital"));
export default function Advertisement() {
  const appearance = useAppearanceStore((state) => state.appearance);
  return appearance === "orbital" ? <Orbital /> : <Classic />;
}
