"use client";
import Loading from "./components/common/Loading";
import MainView from "./components/MainView";
import { useLoading } from "./store";

export default function Home() {
  const { loadingState } = useLoading((state) => state);

  return (
    <>
      <div style={{ backgroundColor: "white" }}>
        {loadingState && <Loading />}
        <MainView />
      </div>
    </>
  );
}
