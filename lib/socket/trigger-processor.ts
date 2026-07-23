export async function triggerNotificationProcessor(
  accessToken: string | undefined,
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

  try {
    const response = await fetch(
      `${appUrl.replace(/\/$/, "")}/notifications/process`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const result = await response.json().catch(() => null);

      console.error("[NotificationProcessorTrigger]", {
        status: response.status,
        result,
      });
    }
  } catch (error) {
    console.error("[NotificationProcessorTrigger]", error);
  }
}
