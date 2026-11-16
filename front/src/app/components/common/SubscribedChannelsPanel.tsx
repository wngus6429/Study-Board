"use client";
import dynamic from "next/dynamic";
import { useAppearanceStore } from "@/app/store/appearanceStore";
import Classic from "./SubscribedChannelsPanelClassic";
import type { SubscribedChannelsPanelProps } from "./SubscribedChannelsPanelClassic";
const Orbital = dynamic(() => import("./SubscribedChannelsPanelOrbital"));
export default function SubscribedChannelsPanel(
  props: SubscribedChannelsPanelProps,
) {
  const appearance = useAppearanceStore((state) => state.appearance);
  return appearance === "orbital" ? (
    <Orbital {...props} />
  ) : (
    <Classic {...props} />
  );
}
