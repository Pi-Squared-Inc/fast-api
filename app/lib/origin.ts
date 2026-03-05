const LOCAL_HOSTS = new Set(['0.0.0.0', '127.0.0.1', '::1', '::']);

/**
 * Normalize local bind addresses to localhost for shareable URLs.
 */
export function normalizeLocalOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (LOCAL_HOSTS.has(url.hostname)) {
      url.hostname = 'localhost';
    }
    return url.origin;
  } catch {
    return origin
      .replace('://0.0.0.0', '://localhost')
      .replace('://127.0.0.1', '://localhost')
      .replace('://[::1]', '://localhost');
  }
}

/**
 * Build an origin from host and normalize local bind addresses.
 */
export function originFromHost(host: string): string {
  const normalizedHost = host
    .replace(/^0\.0\.0\.0(?=[:/]|$)/, 'localhost')
    .replace(/^127\.0\.0\.1(?=[:/]|$)/, 'localhost')
    .replace(/^\[::1\](?=[:/]|$)/, 'localhost')
    .replace(/^::1(?=[:/]|$)/, 'localhost');
  const protocol = normalizedHost.includes('localhost') ? 'http' : 'https';
  return normalizeLocalOrigin(`${protocol}://${normalizedHost}`);
}
