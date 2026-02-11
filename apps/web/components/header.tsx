"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/contexts/WalletContext";

export function Header() {
  const wallet = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl text-black">MITATE</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/markets"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Markets
            </Link>
            <Link
              href="/portfolio"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Portfolio
            </Link>
            <Link
              href="/activity"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Activity
            </Link>
            <Link
              href="/learn"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Learn
            </Link>
          </nav>

          {/* Wallet Button */}
          {wallet.connected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <div className="w-2 h-2 bg-green-300 rounded-full mr-2" />
                  {formatAddress(wallet.address || "")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="text-gray-500 text-xs">
                  {wallet.provider === "xaman" ? "Xaman" : "GemWallet"} • Testnet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portfolio">My Portfolio</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={`https://testnet.xrpl.org/accounts/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on XRPL Explorer →
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={wallet.disconnect}
                  className="text-red-600"
                >
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="bg-black hover:bg-gray-800 text-white"
                  disabled={wallet.loading}
                >
                  {wallet.loading ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    "Connect Wallet"
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => wallet.connect("xaman")}>
                  <span className="mr-2">📱</span>
                  Xaman (XUMM)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => wallet.connect("gemwallet")}>
                  <span className="mr-2">💎</span>
                  GemWallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            <Link
              href="/markets"
              className="text-sm text-gray-600 hover:text-black transition-colors py-2"
            >
              Markets
            </Link>
            <Link
              href="/portfolio"
              className="text-sm text-gray-600 hover:text-black transition-colors py-2"
            >
              Portfolio
            </Link>
            <Link
              href="/activity"
              className="text-sm text-gray-600 hover:text-black transition-colors py-2"
            >
              Activity
            </Link>
            <Link
              href="/learn"
              className="text-sm text-gray-600 hover:text-black transition-colors py-2"
            >
              Learn
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
