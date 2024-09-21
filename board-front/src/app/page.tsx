import Image from "next/image";
import NavMenuBar from "./components/NavMenuBar";
import CustomizedTables from "./components/CustomizedTables";
import StoryWrite from "./components/StoryWrite";

export default function Home() {
  return (
    <main>
      <StoryWrite />
      <CustomizedTables />
    </main>
  );
}
