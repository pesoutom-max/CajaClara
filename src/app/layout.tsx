import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import FAB from "@/components/FAB";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CajaClara | FacilPyme",
  description: "Libro de caja digital para pymes chilenas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 flex justify-center min-h-screen`}
      >
        <div className="w-full max-w-[375px] bg-white min-h-screen relative shadow-lg pb-[60px]">
          <AuthProvider>
            {children}
            <BottomNav />
            <FAB />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
