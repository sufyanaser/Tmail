const TRUSTED_ROOT = 'larksuite.com';

export function isTrustedLarkHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  return normalized === TRUSTED_ROOT || normalized.endsWith(`.${TRUSTED_ROOT}`);
}

export function isTrustedLarkUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' && isTrustedLarkHost(url.hostname);
  } catch {
    return false;
  }
}

export function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}

