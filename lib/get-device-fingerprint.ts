import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedFingerprint: string | null = null;
let inFlight: Promise<string> | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;

  // Avoid kicking off multiple FingerprintJS loads if called
  // concurrently (e.g. double-submit protection on the login form).
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  })();

  return inFlight;
}