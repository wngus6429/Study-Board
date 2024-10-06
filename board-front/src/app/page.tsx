"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainView from "./components/MainView";

export default function Home() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MainView />
    </QueryClientProvider>
  );
}
