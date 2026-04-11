"use client";

import Link from "next/link";
import { Terminal } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
      <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
        <Terminal className="w-8 h-8 text-neutral-300" />
      </div>
      <h1 className="text-4xl font-bold mb-2 tracking-tight">404</h1>
      <p className="text-neutral-400 mb-8 max-w-sm text-center">
        The system path you&apos;re trying to reach does not exist in the matrix.
      </p>
      <Link 
        href="/dashboard"
        className="bg-white text-black font-semibold rounded-lg px-6 py-3 text-sm hover:bg-neutral-200 transition"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
