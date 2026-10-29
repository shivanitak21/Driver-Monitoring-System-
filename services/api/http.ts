import { REQUEST_TIMEOUT_MS, apiBaseUrl } from "@/services/api/config";

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly kind: "http" | "timeout" | "network" | "parse" | "config";

  constructor(
    message: string,
    options: {
      status?: number;
      detail?: string;
      kind?: ApiError["kind"];
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? 0;
    this.detail = options.detail ?? message;
    this.kind = options.kind ?? "http";
  }

  get unauthorized() {
    return this.status === 401 || this.status === 403;
  }

  get notFound() {
    return this.status === 404;
  }

  get timedOut() {
    return this.kind === "timeout";
  }
}

function detailFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (typeof first?.msg === "string" && first.msg.trim()) return first.msg;
  }
  const message = (body as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined | null>;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const base = apiBaseUrl();
  if (!base) {
    throw new ApiError("Telemetry API URL is not configured.", { kind: "config", status: 0 });
  }

  const url = new URL(path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        if (!response.ok) {
          throw new ApiError(response.statusText || "Request failed", {
            status: response.status,
            detail: text.slice(0, 240) || response.statusText,
            kind: "http",
          });
        }
        throw new ApiError("The server returned a non-JSON response.", {
          status: response.status,
          kind: "parse",
        });
      }
    }

    if (!response.ok) {
      const detail = detailFromBody(parsed, response.statusText || "Request failed");
      throw new ApiError(detail, {
        status: response.status,
        detail,
        kind: "http",
      });
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("The request timed out.", { kind: "timeout", status: 0 });
    }
    throw new ApiError(error instanceof Error ? error.message : "Network request failed.", {
      kind: "network",
      status: 0,
    });
  } finally {
    clearTimeout(timer);
  }
}
