import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider"; // 🚀 Import the Theme Provider
import ToastContainer from "@/components/ui/Toast"; 
import AlertContainer from "@/components/ui/AlertConfirm";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "CodeScript - Godavari Global University",
  description: "Master Algorithms in Real-Time",
  // 🚀 Logo/Icon Configuration
  icons: {
    icon: "/CodeScriptLogo.png", // Place your logo in the public folder
    shortcut: "/CodeScriptLogo.png",
    apple: "/CodeScriptLogo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning is necessary when using a theme provider
    // to prevent mismatches between server and client HTML
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* 🚀 Critical: Inline script to prevent "white flash" on page reload */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme') || 'system';
                let isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased selection:bg-primary/30 font-sans`}
      >
        <ThemeProvider>
          {/* Global UI Components */}
          <ToastContainer />
          <AlertContainer />
          
          {/* Main App Content */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}