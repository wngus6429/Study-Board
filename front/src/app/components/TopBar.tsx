"use client";
import dynamic from "next/dynamic";
import { useAppearanceStore } from "../store/appearanceStore";
import TopBarClassicView from "./TopBarClassicView";
import useTopBarController from "./useTopBarController";
const TopBarOrbitalView = dynamic(() => import("./TopBarOrbitalView"));
export default function TopBar() {
  const appearance = useAppearanceStore((state) => state.appearance);
  const controller = useTopBarController();
  return appearance === "orbital" ? (
    <TopBarOrbitalView {...controller} />
  ) : (
    <TopBarClassicView {...controller} />
  );
}
