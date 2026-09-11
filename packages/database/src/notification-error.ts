/** Persist codes only, never raw provider responses or secrets. */
export class NotificationError extends Error {
  constructor(public code: string, public retryable: boolean, public retryAfterSeconds = 0) { super(code); }
}
