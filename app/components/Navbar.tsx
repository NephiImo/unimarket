
"use client";

import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-[#ebc8ba]/60 bg-[#fffdfc]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <a
            href="/"
            className="text-2xl font-bold tracking-tight text-[#352b28]"
          >
            Uni<span className="text-[#c96f52]">Market</span>
          </a>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="/"
              className="text-sm font-medium text-[#352b28] transition-colors hover:text-[#c96f52]"
            >
              Home
            </a>

            <a
              href="/listings"
              className="text-sm font-medium text-[#746963] transition-colors hover:text-[#c96f52]"
            >
              Browse Listings
            </a>

            <a
              href="/listings/new"
              className="rounded-full bg-[#c96f52] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b85f45]"
            >
              Sell an Item
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-[#352b28] md:hidden"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile navigation */}
        {isOpen && (
          <div className="border-t border-[#ebc8ba]/60 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <a
                href="/"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-[#352b28] hover:bg-[#f6f1ea]"
              >
                Home
              </a>

              <a
                href="/listings"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-[#746963] hover:bg-[#f6f1ea]"
              >
                Browse Listings
              </a>

              <a
                href="/listings/new"
                onClick={() => setIsOpen(false)}
                className="mt-2 rounded-full bg-[#c96f52] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#b85f45]"
              >
                Sell an Item
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


