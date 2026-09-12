export function authErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (
    (error instanceof Error && error.name === 'AuthRetryableFetchError') ||
    /network request failed|failed to fetch|network error/i.test(message)
  ) {
    return 'Offtasks could not reach the sign-in service. Check your connection and try again. If this continues, the service may be unavailable.';
  }
  return message || 'Sign-in could not be completed. Please try again.';
}
