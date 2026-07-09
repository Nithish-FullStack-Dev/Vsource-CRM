"use client";

import React, { useEffect } from "react";
import { Check, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function ToastContainer({
  toasts,
  onClose,
}: ToastContainerProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const isSuccess = toast.type === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md ${
        isSuccess
          ? "bg-zinc-900/95 border-emerald-500/30 text-white dark:bg-zinc-900/95 dark:border-emerald-500/30"
          : "bg-zinc-900/95 border-red-500/30 text-white dark:bg-zinc-900/95 dark:border-red-500/30"
      }`}
    >
      <div
        className={`p-1.5 rounded-lg shrink-0 ${isSuccess ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
      >
        {isSuccess ? <Check size={16} /> : <AlertCircle size={16} />}
      </div>
      <div className="flex-1 text-sm font-medium leading-tight pt-1">
        {toast.message}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-zinc-400 hover:text-white transition-colors p-1 rounded-md hover:bg-zinc-800 shrink-0"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
