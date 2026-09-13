/** Drawn with plain shapes so ImageResponse needs no emoji font download at build time. */
export function AppIcon({ size }: { size: number }) {
  const u = size / 100;
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#173327" }}>
      <div
        style={{
          width: 64 * u,
          height: 64 * u,
          borderRadius: 14 * u,
          background: "#e8c158",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(-8deg)",
        }}
      >
        <div style={{ fontSize: 46 * u, fontWeight: 800, color: "#1d2f4b", lineHeight: 1 }}>?</div>
      </div>
    </div>
  );
}
