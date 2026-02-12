import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { WalletProvider } from "@/contexts/WalletContext";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "MITATE — 予測マーケット",
  description: "日本初の属性重み付け型予測マーケット",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <UserProvider>
              <TooltipProvider>
                <Header />
                <main className="min-h-screen">{children}</main>
                <footer className="border-t border-border py-8 mt-12">
                  <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
                      <div className="mb-4 md:mb-0">
                        © 2026 MITATE. XRPL Parimutuel Prediction Market.
                      </div>
                      <div className="flex space-x-6">
                        <a
                          href="#"
                          className="hover:text-foreground transition-colors"
                        >
                          利用規約
                        </a>
                        <a
                          href="#"
                          className="hover:text-foreground transition-colors"
                        >
                          プライバシー
                        </a>
                        <a
                          href="#"
                          className="hover:text-foreground transition-colors"
                        >
                          お問い合わせ
                        </a>
                      </div>
                    </div>
                  </div>
                </footer>
                <Toaster />
              </TooltipProvider>
            </UserProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
