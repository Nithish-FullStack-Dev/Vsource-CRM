"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "motion/react";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <motion.button
      id="theme-toggle"
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
        isDark
          ? "bg-zinc-900 border-zinc-800 text-yellow-400 hover:border-zinc-700 hover:bg-zinc-850"
          : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm"
      }`}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <>
          <Sun size={16} className="animate-pulse" />
          <span className="text-xs font-bold text-zinc-300">Light Mode</span>
        </>
      ) : (
        <>
          <Moon size={16} />
          <span className="text-xs font-bold text-zinc-700">Dark Mode</span>
        </>
      )}
    </motion.button>
  );
}
