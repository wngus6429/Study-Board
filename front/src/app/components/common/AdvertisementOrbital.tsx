import Image from "next/image";

export default function Advertisement() {
  return (
    <aside
      style={{
        width: "100%",
        maxWidth: 400,
        margin: "0 auto 24px",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          color: "var(--muted)",
          fontFamily: "ui-monospace, monospace",
          fontSize: 10,
          letterSpacing: ".12em",
        }}
      >
        BEYOND YOUR ORBIT ↗
      </div>
      <Image
        src="/assets/right.png"
        alt="우주 속 미래 도시"
        width={941}
        height={1672}
        sizes="(max-width: 430px) calc(100vw - 28px), (max-width: 1500px) 400px, 320px"
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    </aside>
  );
}
