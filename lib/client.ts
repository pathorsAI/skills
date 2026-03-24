/**
 * Shared Pathors API client for skill scripts.
 *
 * Handles authentication, request/response, and error formatting.
 * All scripts import from here so auth + error handling is consistent.
 */

const API_URL = process.env.PATHORS_API_URL ?? "https://api.pathors.com";
const API_KEY = process.env.PATHORS_API_KEY ?? "";

if (!API_KEY) {
  console.error("ERROR: PATHORS_API_KEY is not set");
  process.exit(1);
}

export interface ApiError {
  ok: false;
  error: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export async function api<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  const url = `${API_URL}/v1${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: json.error?.message ?? `HTTP ${res.status}`,
        details: json.error?.details,
      };
    }

    return { ok: true, data: json.data ?? json };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Print result as JSON and exit with appropriate code */
export function output<T>(result: ApiResult<T>): never {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

/** Print data directly and exit */
export function outputData(data: unknown): never {
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

/** Print error and exit */
export function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

/** Parse CLI args: script.ts <action> [positional...] */
export function parseArgs(): { action: string; args: string[] } {
  const [, , action, ...rest] = process.argv;
  if (!action) {
    return { action: "help", args: [] };
  }
  return { action, args: rest };
}
