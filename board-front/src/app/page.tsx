"use client";
import Image from "next/image";
import NavMenuBar from "./components/NavMenuBar";
import CustomizedTables from "./components/CustomizedTables";
import StoryWrite from "./components/StoryWrite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Home() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <StoryWrite />
      <CustomizedTables />
    </QueryClientProvider>
  );
}
