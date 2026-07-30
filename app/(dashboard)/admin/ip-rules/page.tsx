"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDeviceFingerprint } from "@/lib/get-device-fingerprint";
import { useAuth } from "@/store";
import { ROLES } from "@/lib/roles";

const IP_CHECK_EXEMPT_ROLES: string[] = [ROLES.SUPER_ADMIN, ROLES.DIRECTOR];

interface IpRule {
  id: string;
  ip: string;
  deviceFingerprint: string | null;
  label: string | null;
  status: "ALLOWED" | "BLOCKED";
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function IpRulesPage() {
  const currentUser = useAuth((s) => s.user);
  const isExemptRole = IP_CHECK_EXEMPT_ROLES.includes(
    currentUser?.role?.name ?? "",
  );

  const [rules, setRules] = useState<IpRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);

  // Current session info
  const [currentIp, setCurrentIp] = useState("");
  const [currentFingerprint, setCurrentFingerprint] = useState("");
  const [allowingSelf, setAllowingSelf] = useState(false);
  const [selfStatus, setSelfStatus] = useState("");

  // Manual add form
  const [ip, setIp] = useState("");
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<"ALLOWED" | "BLOCKED">("ALLOWED");
  const [duration, setDuration] = useState<string>("");
  const [savingManual, setSavingManual] = useState(false);

  const fetchRules = async () => {
    setLoadingRules(true);
    const res = await fetch("/api/admin/ip-rules");
    setRules(await res.json());
    setLoadingRules(false);
  };

  const fetchSelf = async () => {
    const res = await fetch("/api/dev/whoami");
    const data = await res.json();
    setCurrentIp(data.ip);

    const fp = await getDeviceFingerprint();
    setCurrentFingerprint(fp);
  };

  useEffect(() => {
    fetchRules();
    // Only bother fetching self info if the "This Device" card will actually be shown
    if (!isExemptRole) {
      fetchSelf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExemptRole]);

  const saveRule = async (payload: {
    ip: string;
    deviceFingerprint?: string | null;
    label?: string;
    status: "ALLOWED" | "BLOCKED";
    durationMinutes?: number | null;
  }) => {
    await fetch("/api/admin/ip-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchRules();
  };

  const allowCurrentDevice = async () => {
    setAllowingSelf(true);
    setSelfStatus("");
    await saveRule({
      ip: currentIp,
      deviceFingerprint: currentFingerprint,
      label: "Registered via admin panel",
      status: "ALLOWED",
      durationMinutes: null,
    });
    setAllowingSelf(false);
    setSelfStatus("✅ This device has been allowed.");
  };

  const addManualRule = async () => {
    if (!ip) return;
    setSavingManual(true);
    await saveRule({
      ip,
      deviceFingerprint: deviceFingerprint || null,
      label,
      status,
      durationMinutes: duration ? Number(duration) : null,
    });
    setIp("");
    setDeviceFingerprint("");
    setLabel("");
    setDuration("");
    setSavingManual(false);
  };

  const toggleStatus = async (rule: IpRule) => {
    const newStatus = rule.status === "ALLOWED" ? "BLOCKED" : "ALLOWED";
    await fetch(`/api/admin/ip-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchRules();
  };

  const setTemporaryAllow = async (rule: IpRule, minutes: number) => {
    await fetch(`/api/admin/ip-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ALLOWED", durationMinutes: minutes }),
    });
    fetchRules();
  };

  const removeRule = async (id: string) => {
    await fetch(`/api/admin/ip-rules/${id}`, { method: "DELETE" });
    fetchRules();
  };

  const isExpired = (rule: IpRule) =>
    rule.expiresAt && new Date(rule.expiresAt) <= new Date();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Device & IP Access Control</h1>

      {/* Current session card — hidden for exempt roles (Super Admin / Director) */}
      {!isExemptRole && (
        <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
          <h2 className="font-semibold text-sm text-muted-foreground">
            This Device
          </h2>
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">IP:</span>{" "}
              <code>{currentIp || "loading..."}</code>
            </div>
            <div>
              <span className="font-medium">Fingerprint:</span>{" "}
              <code className="break-all">
                {currentFingerprint || "loading..."}
              </code>
            </div>
          </div>
          <Button
            onClick={allowCurrentDevice}
            disabled={allowingSelf || !currentIp || !currentFingerprint}
            size="sm"
          >
            {allowingSelf ? "Saving..." : "Allow This Device"}
          </Button>
          {selfStatus && <p className="text-sm">{selfStatus}</p>}
        </div>
      )}

      {/* Manual add / block form */}
      <div className="space-y-3 border rounded-xl p-4">
        <h2 className="font-semibold text-sm text-muted-foreground">
          Add / Block IP or Device Manually
        </h2>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
          <div>
            <Label>IP Address</Label>
            <Input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 103.21.244.10"
            />
          </div>
          <div>
            <Label>Device Fingerprint (optional)</Label>
            <Input
              value={deviceFingerprint}
              onChange={(e) => setDeviceFingerprint(e.target.value)}
              placeholder="leave blank for IP-only rule"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
          <div>
            <Label>Label (optional)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Office WiFi"
            />
          </div>
          <div>
            <Label>Status</Label>
            <select
              className="w-full border rounded-md h-10 px-3"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "ALLOWED" | "BLOCKED")
              }
            >
              <option value="ALLOWED">Allowed</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
          <div>
            <Label>Duration (minutes, blank = permanent)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30, 60, 180"
            />
          </div>
        </div>
        <Button
          onClick={addManualRule}
          disabled={savingManual || !ip}
          size="sm"
        >
          {savingManual ? "Saving..." : "Save Rule"}
        </Button>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground">
          All Rules
        </h2>

        {loadingRules && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}

        {!loadingRules && rules.length === 0 && (
          <p className="text-sm text-muted-foreground">No rules yet.</p>
        )}

        {rules.map((r) => {
          const expired = isExpired(r);

          return (
            <div
              key={r.id}
              className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
            >
              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="break-all font-medium">
                  {r.ip}{" "}
                  {r.label && (
                    <span className="text-muted-foreground">({r.label})</span>
                  )}
                </div>

                {r.deviceFingerprint && (
                  <div className="mt-1 break-all text-xs text-muted-foreground">
                    device: {r.deviceFingerprint.slice(0, 20)}...
                  </div>
                )}

                <div className="mt-2 text-xs">
                  <span
                    className={
                      r.status === "ALLOWED" && !expired
                        ? "text-green-600"
                        : "text-red-500"
                    }
                  >
                    {expired ? "EXPIRED" : r.status}
                  </span>{" "}
                  {r.expiresAt
                    ? `· expires ${new Date(r.expiresAt).toLocaleString()}`
                    : "· permanent"}
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap md:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => toggleStatus(r)}
                >
                  {r.status === "ALLOWED" ? "Block" : "Allow"}
                </Button>

                <select
                  className="h-8 flex-1 rounded-md border px-2 text-xs sm:flex-none"
                  defaultValue=""
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val) setTemporaryAllow(r, val);
                  }}
                >
                  <option value="">Temp allow...</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hr</option>
                  <option value="180">3 hr</option>
                </select>

                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => removeRule(r.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
