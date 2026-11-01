import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momentum — AI Meeting-to-Execution & Institutional Memory",
  description:
    "Momentum converts team conversations into structured decisions, persistent institutional memory, conflict alerts, and executed work.",
  openGraph: {
    title: "Momentum — AI Meeting-to-Execution & Institutional Memory",
    description:
      "Convert team conversations into structured decisions, persistent institutional memory, conflict alerts, and executed work.",
    siteName: "Momentum",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&family=Instrument+Serif:ital@0;1&family=Inter+Tight:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('momentum-theme');
                  if (!saved) {
                    var m = document.cookie.match(/momentum-theme=([^;]+)/);
                    if (m) saved = m[1];
                  }
                  var t = (saved === 'light') ? 'light' : 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(t);
                  if (document.body) {
                    document.body.setAttribute('data-theme', t);
                    document.body.classList.remove('dark', 'light');
                    document.body.classList.add(t);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="font-ui antialiased min-h-dvh relative selection:bg-ember/25 selection:text-text-1"
        style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}
      >
        {/* Subtle 3% SVG Noise Texture Overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        {children}
      </body>
    </html>
  );
}
