export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type ApiHandlerResult<T> = {
  status: number;
  body: ApiResponse<T>;
};

const safeMessages: Record<string, string> = {
  unauthenticated: "Authentication is required.",
  forbidden: "You do not have permission to perform this action.",
  validation_failed: "The request is invalid.",
  stale_update: "The task changed before this request completed.",
  not_found: "The requested resource was not found.",
  temporarily_unavailable: "The request could not be completed right now.",
};

export function apiFailure(code: string): ApiHandlerResult<never> {
  const status = code === "unauthenticated" ? 401
    : code === "forbidden" ? 403
      : code === "not_found" ? 404
        : code === "validation_failed" ? 400
          : code === "stale_update" ? 409 : 503;
  return { status, body: { ok: false, error: { code, message: safeMessages[code] ?? safeMessages.temporarily_unavailable } } };
}

export function apiSuccess<T>(data: T, status = 200): ApiHandlerResult<T> {
  return { status, body: { ok: true, data } };
}
