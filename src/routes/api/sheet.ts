import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/sheet")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const incomingUrl = new URL(request.url);
          const apiUrl = incomingUrl.searchParams.get("target") || import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

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

          const response = await fetch(upstreamUrl.toString(), {
            headers: { accept: "application/json" },
          });
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
          return Response.json(
            {
              ok: false,
              error: error instanceof Error ? error.message : "Unable to fetch Google Sheet data.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
