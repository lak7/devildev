import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevilDev",
  description: "Visualize any codebase, chat with your code for answers & prompts, or generate new architectures from scratch",
  icons: {
    icon: "/nakedLogo.png",
  },
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  other: {
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
    "msapplication-navbutton-color": "#000000",
    "msapplication-TileColor": "#000000",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <head suppressHydrationWarning>
          {/* Google Analytics */}
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-875ZFE6Y2B"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-875ZFE6Y2B');
              `,
            }}
          />
          <meta name="theme-color" content="#000000" />
          <meta
            name="theme-color"
            media="(prefers-color-scheme: dark)"
            content="#000000"
          />
          <meta
            name="theme-color"
            media="(prefers-color-scheme: light)"
            content="#000000"
          />
          <meta name="msapplication-navbutton-color" content="#000000" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="format-detection" content="telephone=no" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
