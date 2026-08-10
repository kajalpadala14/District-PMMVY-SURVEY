const CONFIG_PLACEHOLDER = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

type SheetPayload<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
  preview?: string;
  meta?: {
    count?: number;
    cached?: boolean;
    asOf?: string;
  };
};

export function getConfiguredSheetUrl() {
  return String(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || "").replace(/\s/g, "");
}

export function isSheetApiConfigured() {
  const url = getConfiguredSheetUrl();
  return Boolean(url && !url.includes(CONFIG_PLACEHOLDER));
}

export async function fetchSheetGet<T>(params: URLSearchParams): Promise<SheetPayload<T>> {
  try {
    return await requestJson<T>(`/api/sheet?${params.toString()}`, { method: "GET" });
  } catch (error) {
    if (!isSheetApiConfigured() || !canRetryDirectly(error)) {
      throw normalizeSheetError(error, "Sheet data load nahi ho pa raha.");
    }

    try {
      const directUrl = new URL(getConfiguredSheetUrl());
      params.forEach((value, key) => directUrl.searchParams.set(key, value));
      return await requestJson<T>(directUrl.toString(), { method: "GET" });
    } catch (directError) {
      throw normalizeSheetError(directError, "Sheet se connection nahi ho pa raha. Apps Script deployment access check karein.");
    }
  }
}

export async function fetchSheetPost<T>(body: unknown): Promise<SheetPayload<T>> {
  try {
    return await requestJson<T>("/api/sheet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw normalizeSheetError(error, "Sheet update save nahi ho pa raha.");
  }
}

async function requestJson<T>(input: RequestInfo | URL, init: RequestInit) {
  const response = await fetch(input, init);
  const text = await response.text();
  const payload = parsePayload<T>(text);

  if (!response.ok || payload.ok === false) {
    throw new SheetApiError(payload.error || `Sheet API failed: ${response.status}`, response.status, payload.preview);
  }

  return payload;
}

function parsePayload<T>(text: string): SheetPayload<T> {
  try {
    return JSON.parse(text) as SheetPayload<T>;
  } catch {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 160);
    throw new SheetApiError("Sheet API ne JSON response nahi diya.", 0, preview);
  }
}

function canRetryDirectly(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof SheetApiError && (error.status === 0 || error.status === 404 || error.status === 405))
  );
}

function normalizeSheetError(error: unknown, fallback: string) {
  if (error instanceof SheetApiError) {
    return new Error(error.preview ? `${error.message} Preview: ${error.preview}` : error.message);
  }
  if (error instanceof Error && error.message && error.message !== "Failed to fetch") {
    return error;
  }
  return new Error(fallback);
}

class SheetApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly preview?: string,
  ) {
    super(message);
    this.name = "SheetApiError";
  }
}
