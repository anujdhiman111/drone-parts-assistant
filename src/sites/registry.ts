import type { SiteAdapter } from './types';
import { robuAdapter } from './robu';

const adapters: SiteAdapter[] = [robuAdapter];

export function getAdapterForUrl(url: string): SiteAdapter | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }

  return adapters.find((a) => hostname === a.hostname || hostname.endsWith(`.${a.hostname}`)) ?? null;
}

export function isSupportedUrl(url: string): boolean {
  return getAdapterForUrl(url) !== null;
}

export function listSupportedHostnames(): string[] {
  return adapters.map((a) => a.hostname);
}
