import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";
import { ClientProviders } from "./providers/ClientProviders";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

// ✅ Optimize font loading - no layout shift
const inter = Inter({
  subsets: ["latin"],
  display: "fallback",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

// ✅ Metadata export (without viewport and themeColor)
export const metadata: Metadata = {
  title: {
    default: "Nexus Esports Hub",
    template: "%s | Nexus Esports Hub",
  },
  description: "School Esports Platform for eFootball",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexus Esports Hub",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Nexus Esports Hub",
    description: "School Esports Platform for eFootball",
    url: "https://nexusesportshub.vercel.app",
    siteName: "Nexus Esports Hub",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus Esports Hub",
    description: "School Esports Platform for eFootball",
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

// ✅ Separate viewport export (required by Next.js 15+)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={inter.className}
      style={{ 
        height: "100%", 
        backgroundColor: "#0f172a",
        scrollBehavior: "smooth",
      }}
    >
      <head>
        {/* ✅ Preconnect to critical domains */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ✅ DNS Prefetch */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* ✅ Preload critical assets */}
        <link rel="preload" href="/icons/icon-192.png" as="image" />
        <link rel="preload" href="/icons/icon-512.png" as="image" />

        {/* ✅ Security Headers via meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta name="referrer" content="origin-when-cross-origin" />

        {/* ✅ PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nexus Esports Hub" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* ✅ PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* ✅ Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#4F46E5" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
      </head>
      <body
        style={{
          minHeight: "100dvh",
          backgroundColor: "#0f172a",
          margin: 0,
          padding: 0,
          position: "relative",
          overflowX: "hidden",
        }}
      >
        {/* ✅ Full background wrapper - covers everything */}
        <div 
          className="fixed inset-0 -z-20 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
          style={{ 
            minHeight: "100dvh",
          }}
        >
          {/* Background orbs - fixed and always behind */}
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute top-1/4 -left-20 h-64 w-64 rounded-full bg-emerald-600/10 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        {/* ✅ Content wrapper */}
        <div className="relative z-0 min-h-dvh">
          <AuthProvider>
            <MaintenanceOverlay>
              <ClientProviders>
                {children}
                {/* ✅ Vercel Analytics (only in production) */}
                {process.env.NODE_ENV === "production" && (
                  <>
                    <SpeedInsights />
                    <Analytics />
                  </>
                )}
              </ClientProviders>
            </MaintenanceOverlay>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}