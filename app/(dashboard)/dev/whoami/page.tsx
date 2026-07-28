"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDeviceFingerprint } from "@/lib/get-device-fingerprint";

export default function WhoAmIPage() {
  const [ip, setIp] = useState<string>("");
  const [fingerprint, setFingerprint] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/dev/whoami");
      const data = await res.json();
      setIp(data.ip);

      const fp = await getDeviceFingerprint();
      setFingerprint(fp);
    })();
  }, []);

  const allowThisDevice = async () => {
    setSaving(true);
    setStatus("");
    const res = await fetch("/api/admin/ip-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip,
        deviceFingerprint: fingerprint,
        label: "Registered via /dev/whoami",
        status: "ALLOWED",
        durationMinutes: null, // permanent
      }),
    });
    setSaving(false);
    setStatus(res.ok ? "✅ Device allowed successfully." : "❌ Failed to save rule.");
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Dev: Who Am I</h1>

      <div className="border rounded-lg p-4 space-y-2 text-sm">
        <div>
          <span className="font-medium">Detected IP:</span>{" "}
          <code>{ip || "loading..."}</code>
        </div>
        <div>
          <span className="font-medium">Device Fingerprint:</span>{" "}
          <code className="break-all">{fingerprint || "loading..."}</code>
        </div>
      </div>

      <Button onClick={allowThisDevice} disabled={saving || !ip || !fingerprint}>
        {saving ? "Saving..." : "Allow This Device"}
      </Button>

      {status && <p className="text-sm">{status}</p>}
    </div>
  );
}