import { ErrorHandler, Injectable, isDevMode } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    // Extract the actual error
    const err = (error as { rejection?: unknown })?.rejection ?? error;

    if (isDevMode()) {
      console.error('[GlobalErrorHandler]', err);
    }

    // Skip Clerk-specific errors (handled by auth components)
    if (this.isClerkError(err)) return;

    // In production, you would send this to a logging service (e.g., Sentry)
  }

  private isClerkError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'errors' in err &&
      Array.isArray((err as { errors: unknown[] }).errors)
    );
  }
}
