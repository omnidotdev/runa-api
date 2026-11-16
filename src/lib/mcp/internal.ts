/**
 * Marks requests the server makes to itself (MCP tool calls running GraphQL).
 * The nonce is random per process and never leaves it, so an external client
 * cannot forge the header; the outer `/mcp` request is already rate limited,
 * so its inner GraphQL calls are exempt
 */
export const INTERNAL_REQUEST_HEADER = "x-runa-internal";

export const INTERNAL_REQUEST_NONCE = crypto.randomUUID();

/** Whether a request was issued by this process to itself */
export const isInternalRequest = (request: Request): boolean =>
  request.headers.get(INTERNAL_REQUEST_HEADER) === INTERNAL_REQUEST_NONCE;
