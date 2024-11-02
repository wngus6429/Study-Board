import React from "react";
import Image from "next/image";

export default function Advertisement() {
  return (
    <div style={{ width: 200 }}>
      <Image
        src="/assets/right.png"
        alt="Right Icon"
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
      />
      광고가 올자리
      <Image
        src="/assets/right2.png"
        alt="Right Icon"
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
}
