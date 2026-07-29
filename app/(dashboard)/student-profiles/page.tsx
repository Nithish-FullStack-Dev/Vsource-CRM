// app\(dashboard)\student-profiles\page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { StudentTable } from "./StudentTable";

export default function Home() {
  const router = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const syncTheme = () => {
      setIsDarkMode(root.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`${isDarkMode ? "dark" : ""} flex min-h-screen bg-background text-foreground transition-colors duration-200`}
    >
      <div className="grow flex min-w-0 min-h-screen flex-col">
        <motion.div
          key="students-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-6 animate-fadeIn"
        >
          <StudentTable
            isDarkMode={isDarkMode}
            onSelectStudent={(id) => router.push(`/student-profiles/${id}`)}
          />
        </motion.div>
      </div>
    </div>
  );
}
