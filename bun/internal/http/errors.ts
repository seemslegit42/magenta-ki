/** Consistent API error body (contract-first). */
export interface APIErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: APIErrorBody = {
    error: details === undefined ? { code, message } : { code, message, details },
  };
  return Response.json(body, { status });
}
