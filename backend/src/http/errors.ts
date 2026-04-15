export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(typeof body === "object" ? JSON.stringify(body) : String(body));
    this.status = status;
    this.body = body;
  }
}

export function validationError(fields: Record<string, string>) {
  return new HttpError(400, { error: "validation failed", fields });
}

export function unauthorized() {
  return new HttpError(401, { error: "unauthorized" });
}

export function forbidden() {
  return new HttpError(403, { error: "forbidden" });
}

export function notFound() {
  return new HttpError(404, { error: "not found" });
}

