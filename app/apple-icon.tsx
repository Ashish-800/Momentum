import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          borderRadius: "40px",
          border: "1px solid #E2E8F0",
        }}
      >
        <svg
          viewBox="0 0 64 64"
          width="130"
          height="130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ap-cyan" x1="4" y1="20" x2="32" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00D2FF" />
              <stop offset="55%" stopColor="#1A4BFF" />
              <stop offset="100%" stopColor="#3B1D9E" />
            </linearGradient>
            <linearGradient id="ap-sky" x1="16" y1="16" x2="38" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="ap-blue-pink" x1="28" y1="16" x2="58" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="40%" stopColor="#7C3AED" />
              <stop offset="75%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#FF5500" />
            </linearGradient>
            <linearGradient id="ap-flame" x1="34" y1="30" x2="48" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="35%" stopColor="#EC4899" />
              <stop offset="70%" stopColor="#FF5500" />
              <stop offset="100%" stopColor="#FFA800" />
            </linearGradient>
          </defs>

          <g transform="translate(6, 7) scale(0.82)">
            <path d="M17 14 L27 14 L24 23 L14 23 Z" fill="url(#ap-cyan)" />
            <path d="M3 33 L18 28 C 24 26, 31 22, 36 14 L28 14 C 23 20, 16 24, 7 28 Z" fill="url(#ap-cyan)" />
            <path d="M3 47 C 8 46, 12 43, 16 38 L22 38 C 17 44, 11 48, 5 48 Z" fill="url(#ap-cyan)" />
            <polygon points="17,35 24,24 29,24 21,38" fill="url(#ap-cyan)" />
            <path d="M19 46 L33 22 L40 22 L26 46 Z" fill="url(#ap-sky)" />
            <path d="M36 14 L49 14 C 54 14, 58 19, 56 25 L50 38 C 48 42, 45 44, 41 44 L43 38 C 45 38, 47 36, 48 33 L52 23 C 53 19, 50 17, 47 17 L38 17 Z" fill="url(#ap-blue-pink)" />
            <path d="M38 29 C 41 24, 45 25, 45 31 C 45 37, 40 46, 37 47 C 36 43, 36 36, 38 29 Z" fill="url(#ap-flame)" />
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}

