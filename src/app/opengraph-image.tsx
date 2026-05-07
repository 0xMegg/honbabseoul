import { ImageResponse } from "next/og";

export const alt = "혼밥서울 - おひとりさま専用・ソウルグルメマップ";
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200,
};

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f7f2ea",
        color: "#241f1a",
        display: "flex",
        fontFamily: "sans-serif",
        height: "100%",
        justifyContent: "center",
        padding: "64px",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "4px solid #241f1a",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          height: "100%",
          justifyContent: "space-between",
          padding: "56px",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#d74d2a",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 0,
          }}
        >
          ホンバプソウル
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              fontSize: 112,
              fontWeight: 900,
              letterSpacing: 0,
              lineHeight: 1,
            }}
          >
            혼밥서울
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            おひとりさま専用・ソウルグルメマップ
          </div>
        </div>
        <div
          style={{
            color: "#5f5a52",
            fontSize: 30,
            letterSpacing: 0,
          }}
        >
          一人でも入りやすいソウルのお店を探す
        </div>
      </div>
    </div>,
    size,
  );
}
