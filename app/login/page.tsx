// app\login\page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Sparkles,
  Globe2,
  Users2,
  GraduationCap,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import logo from "@/assets/vsourcess.png";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GuestGuard from "@/components/guards/GuestGuard";
import { getDeviceFingerprint } from "@/lib/get-device-fingerprint";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  useEffect(() => {
    getDeviceFingerprint();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAttemptsLeft(null);
    setLoading(true);

    const deviceFingerprint = await getDeviceFingerprint();
    const res = await login(email, password, deviceFingerprint);

    setLoading(false);

    if (res.ok) {
      return;
    }

    setError(res.error || "Invalid email or password");
    if (typeof res.attemptsLeft === "number") {
      setAttemptsLeft(res.attemptsLeft);
    }
  };

  return (
    <GuestGuard>
      <div className="min-h-screen w-full grid md:grid-cols-2 bg-background">
        {/* Brand panel */}
        <div className="relative hidden md:flex flex-col justify-between p-10 overflow-hidden bg-(image:--gradient-primary) text-white">
          <motion.div
            aria-hidden
            className="absolute -top-32 -right-32 size-105 rounded-full bg-white/10 blur-3xl"
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-32 -left-32 size-105 rounded-full bg-white/10 blur-3xl"
            animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
          />

          <div className="relative flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl bg-white/10 backdrop-blur px-3 py-2">
              <Image
                src={logo}
                alt="VSource Logo"
                className="h-10 w-auto object-contain md:h-12"
              />
            </div>

            <div className="leading-tight">
              <h2 className="text-lg font-bold text-white">VSource</h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/80">
                Study Abroad CRM
              </p>
            </div>
          </div>

          <div className="relative space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              One platform for your entire <br /> overseas admissions fintech
              company journey.
            </h2>
            <p className="text-white/85 max-w-md">
              Manage leads, applications, loans and counselor performance — all
              in a single, beautifully designed workspace.
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[
                { icon: Users2, label: "Lead Pipeline" },
                { icon: GraduationCap, label: "Admissions" },
                { icon: Globe2, label: "8+ Countries" },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="rounded-xl p-3 bg-white/10 backdrop-blur border border-white/15"
                >
                  <f.icon className="size-4 mb-2" />
                  <div className="text-xs font-medium">{f.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            {" "}
            <p className="mt-10 text-center text-sm text-white/70">
              © {new Date().getFullYear()}Powered by{" "}
              <a
                href="https://www.outrightcreators.com/"
                className="font-medium text-white hover:underline"
              >
                Outright Creators
              </a>
              {". "} · v.demo-1.0
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="md:hidden mb-6 flex items-center gap-2">
              <div className="size-9 rounded-xl bg-(image:--gradient-primary) flex items-center justify-center">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="font-bold">VSource CRM</div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Sign in to your workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your credentials to continue.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address:</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Label htmlFor="password">Password:</Label>

                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-[70%] -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                  {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                  )}

                  {attemptsLeft !== null && attemptsLeft > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left
                      before your account is locked.
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </GuestGuard>
  );
}