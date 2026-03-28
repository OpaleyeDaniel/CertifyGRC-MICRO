/**
 * Shared types between client and server.
 * Add shared interfaces here to keep client ↔ server contracts in sync.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  success?: false;
  error: string;
  message?: string;
}
