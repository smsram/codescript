import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import ToastContainer from "@/components/ui/Toast"; 
import AlertContainer from "@/components/ui/AlertConfirm";
import GlobalStorageFix from '@/components/auth/GlobalStorageFix';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// 🚀 Enhanced SEO Metadata for Google Search Console
export const metadata = {
  title: {
    default: 'CodeScript | Godavari Global University (GGU)',
    template: '%s | CodeScript GGU'
  },
  description: 'The official secure coding environment and college contest platform for Godavari Global University. Join CodeScript for real-time lab assessments and algorithmic challenges.',
  keywords: [
    'Code Script GGU', 
    'Code Script College Contests', 
    'GGU Coding Platform', 
    'Godavari Global University', 
    'CSM-3 CodeScript',
    'Interactive Coding Labs GGU',
    'Proctored Coding Exams'
  ],
  authors: [{ name: 'CSM-3 Development Team' }],
  creator: 'Godavari Global University',
  openGraph: {
    title: 'CodeScript GGU | College Contest Platform',
    description: 'Secure execution environment for GGU computer science students.',
    url: 'https://codescript.dedyn.io',
    siteName: 'CodeScript GGU',
    locale: 'en_IN',
    type: 'website',
  },
  // 🚀 Logo/Icon Configuration
  icons: {
    icon: "/CodeScriptLogo.png", 
    shortcut: "/CodeScriptLogo.png",
    apple: "/CodeScriptLogo.png",
  },
  verification: {
    // 🚀 Now pulling securely from your environment variables
    google: process.env.GOOGLE_SITE_VERIFICATION, 
  }
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
        <GlobalStorageFix />
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