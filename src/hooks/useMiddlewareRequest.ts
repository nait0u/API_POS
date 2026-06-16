import { useCallback } from 'react';
import { useProfileContext } from '@/context/useProfileContext';

// ---------------------------------------------------------------------------
// rawRequest — standalone function for requests with explicit headers.
// Used by views that need to call the middleware with a specific profile
// (e.g. concurrency test that fires both profiles simultaneously).
// ---------------------------------------------------------------------------

export async function rawRequest<T>(
  path: string,
  profileHeaders: Record<string, string>,
  options: Omit<RequestInit, 'headers'> = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...profileHeaders,
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`/bff${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    let message = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      if (typeof parsed.message === 'string') message = parsed.message;
      else if (typeof parsed.error === 'string') message = parsed.error;
      else if (body) message = body;
    } catch {
      if (body) message = body;
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// useMiddlewareRequest — hook that binds rawRequest to the active profile.
// ---------------------------------------------------------------------------

export function useMiddlewareRequest() {
  const { getHeaders } = useProfileContext();

  const request = useCallback(
    <T>(path: string, options: Omit<RequestInit, 'headers'> = {}): Promise<T> =>
      rawRequest<T>(path, getHeaders(), options),
    [getHeaders],
  );

  return { request };
}
