import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ape Terminal | Dashboard",
  description: "Dashboard for machine learning models and predictive analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Ape Terminal Grid Background */}
        <div className="bg-grid"></div>
        <div className="bg-grid-fade"></div>
        
        {/* Graffiti Text Accents */}
        <div className="graffiti-text" style={{ top: '30%', left: '10%' }}>STRONG</div>
        <div className="graffiti-text" style={{ top: '60%', right: '5%' }}>APE TOGETHER</div>

        <div className="relative z-10 flex h-screen overflow-hidden">
          {/* Sidebar Area */}
          <Sidebar />

          {/* Main Content Area (Scrollable) */}
          <main className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto px-6 py-12 scrollbar-hide animate-fade-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
