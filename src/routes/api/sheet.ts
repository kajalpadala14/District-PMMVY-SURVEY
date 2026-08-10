import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/sheet")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const incomingUrl = new URL(request.url);
          const apiUrl = (
            incomingUrl.searchParams.get("target") ||
            import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
            ""
          ).replace(/\s/g, "");

          if (!apiUrl || apiUrl.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE")) {
            return Response.json(
              { ok: false, error: "VITE_GOOGLE_APPS_SCRIPT_URL is not configured." },
              { status: 400 },
            );
          }

          const upstreamUrl = new URL(apiUrl);
          incomingUrl.searchParams.forEach((value, key) => {
            if (key === "target") return;
            upstreamUrl.searchParams.set(key, value);
          });
          if (!upstreamUrl.searchParams.has("action")) {
            upstreamUrl.searchParams.set("action", "beneficiaries");
          }

          const response = await fetchWithTimeout(upstreamUrl.toString(), {
            headers: { accept: "application/json" },
          }, 55000);
          const text = new TextDecoder("utf-8").decode(await response.arrayBuffer());

          try {
            const payload = JSON.parse(text);
            return Response.json(payload, { status: response.ok ? 200 : response.status });
          } catch {
            return Response.json(
              {
                ok: false,
                error: "Google Apps Script did not return JSON. Check Web App deployment access.",
                preview: text.slice(0, 300),
              },
              { status: 502 },
            );
          }
        } catch (error) {
          const timedOut = error instanceof Error && error.name === "AbortError";
          return Response.json(
            {
              ok: false,
              error: formatUpstreamError(error, "Google Sheet request timed out. Apps Script is taking too long to respond."),
            },
            { status: timedOut ? 504 : 502 },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const incomingUrl = new URL(request.url);
          const body = await request.json();
          const apiUrl = (
            incomingUrl.searchParams.get("target") ||
            body.target ||
            import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
            ""
          ).replace(/\s/g, "");

          if (!apiUrl || apiUrl.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE")) {
            return Response.json(
              { ok: false, error: "VITE_GOOGLE_APPS_SCRIPT_URL is not configured." },
              { status: 400 },
            );
          }

          const response = await fetchWithTimeout(apiUrl, {
            method: "POST",
            headers: {
              accept: "application/json",
              "content-type": "application/json",
            },
            body: JSON.stringify(body),
          }, 55000);
          const text = new TextDecoder("utf-8").decode(await response.arrayBuffer());

          try {
            const payload = JSON.parse(text);
            return Response.json(payload, { status: response.ok ? 200 : response.status });
          } catch {
            return Response.json(
              {
                ok: false,
                error: "Google Apps Script did not return JSON. Check Web App deployment access.",
                preview: text.slice(0, 300),
              },
              { status: 502 },
            );
          }
        } catch (error) {
          const timedOut = error instanceof Error && error.name === "AbortError";
          return Response.json(
            {
              ok: false,
              error: formatUpstreamError(error, "Google Sheet update timed out. Apps Script is taking too long to respond."),
            },
            { status: timedOut ? 504 : 502 },
          );
        }
      },
    },
  },
});

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function formatUpstreamError(error: unknown, timeoutMessage: string) {
  if (error instanceof Error && error.name === "AbortError") return timeoutMessage;
  if (error instanceof Error && /fetch failed|failed to fetch/i.test(error.message)) {
    return "Google Apps Script se connection nahi ho pa raha. Internet connection, Apps Script deployment access, aur Web App URL check karein.";
  }
  return error instanceof Error ? error.message : "Unable to reach Google Sheet data.";
}
