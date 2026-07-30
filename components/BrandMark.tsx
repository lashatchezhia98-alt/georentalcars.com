export default function BrandMark() {
  return (
    <span
      className="offroad-mark"
      aria-hidden="true"
      style={{ position: "relative", display: "block", width: 54, height: 34, flex: "0 0 54px" }}
    >
      <i style={{ position: "absolute", left: 3, top: 5, width: 48, height: 22, background: "#10172d", clipPath: "polygon(0 45%,10% 45%,17% 12%,58% 12%,70% 42%,96% 48%,100% 78%,0 78%)", borderRadius: 4 }} />
      <b style={{ position: "absolute", left: 15, top: 8, width: 20, height: 8, background: "#dcd5ff", clipPath: "polygon(0 0,76% 0,100% 100%,0 100%)" }} />
      <em style={{ position: "absolute", left: 7, top: 22, width: 13, height: 13, borderRadius: "50%", background: "#10172d", border: "3px solid white" }} />
      <strong style={{ position: "absolute", left: 36, top: 22, width: 13, height: 13, borderRadius: "50%", background: "#10172d", border: "3px solid white" }} />
    </span>
  );
}
