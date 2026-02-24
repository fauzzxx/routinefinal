/**
 * Request a step video from the backend. The API matches the prompt to
 * pre-recorded videos (no external models). Use VITE_BACKEND_URL for local server.
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

export async function requestGenerateAnimation(
  prompt: string
): Promise<{ video_path: string }> {
  const base = BACKEND_URL ? BACKEND_URL.replace(/\/$/, "") : "";
  const path = "/api/generate-animation";
  const url = base
    ? `${base}${path}?prompt=${encodeURIComponent(prompt)}`
    : `${path}?prompt=${encodeURIComponent(prompt)}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const j = JSON.parse(text) as { detail?: string };
      if (typeof j.detail === "string") message = j.detail;
    } catch {
      /* use text as-is */
    }
    if (
      res.status >= 500 ||
      /FUNCTION_INVOCATION_FAILED|server error|invocation failed/i.test(message)
    ) {
      message =
        "Video service unavailable. Run the app with a local backend (npm run server) or ensure api/recordings is deployed.";
    }
    throw new Error(message || `Failed to generate video (${res.status})`);
  }
  return res.json();
}
