"use client";
import dynamic from "next/dynamic";
import Loading from "@/app/components/common/Loading";
import { useAppearanceStore } from "@/app/store/appearanceStore";
import ChannelsClassicView from "./ChannelsClassicView";
import useChannelsController from "./useChannelsController";
import type { ChannelsClientProps } from "./useChannelsController";
const ChannelsOrbitalView = dynamic(() => import("./ChannelsOrbitalView"), {
  loading: () => <Loading />,
});
export default function ChannelsClient(props: ChannelsClientProps) {
  const appearance = useAppearanceStore((state) => state.appearance);
  const controller = useChannelsController(props);
  if (controller.isLoading && !props.initialChannels.length) return <Loading />;
  return appearance === "orbital" ? (
    <ChannelsOrbitalView {...controller} />
  ) : (
    <ChannelsClassicView {...controller} />
  );
}
