import { Inter } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/ui/Toast"; 
import AlertContainer from "@/components/ui/AlertConfirm"; // 👈 Import the Alert Container

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "CodeScript - Godavari Global University",
  description: "Master Algorithms in Real-Time",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} antialiased selection:bg-primary/30 selection:text-cyan-100 font-sans`}
      >
        {/* Global UI Components placed at the root level */}
        <ToastContainer />
        <AlertContainer /> {/* 👈 Add the Alert Container here */}
        
        {children}
      </body>
    </html>
  );
}