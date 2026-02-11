import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { WalletProvider } from "@/contexts/WalletContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MITATE - Prediction Market",
  description: "Trade on the outcome of real-world events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white`}>
        <WalletProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-gray-200 py-8 mt-12">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
                <div className="mb-4 md:mb-0">
                  © 2026 MITATE. XRPL Parimutuel Prediction Market.
                </div>
                <div className="flex space-x-6">
                  <a href="#" className="hover:text-black transition-colors">Terms</a>
                  <a href="#" className="hover:text-black transition-colors">Privacy</a>
                  <a href="#" className="hover:text-black transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
