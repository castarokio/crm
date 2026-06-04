export function formatWhatsappPhone(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }
  // Convert Algerian local number (e.g. 0555123456) to international (213555123456)
  if (digits.startsWith('0') && digits.length === 10) {
    return '213' + digits.substring(1);
  }
  // If it's a 9-digit number starting with 5, 6 or 7, prepend 213
  if (digits.length === 9 && /^[567]/.test(digits)) {
    return '213' + digits;
  }
  return digits;
}

export function extractSocialHandle(url?: string | null): string {
  if (!url) return '';
  const cleanUrl = url.trim().replace(/\/$/, ''); // Remove trailing slash
  try {
    const parts = cleanUrl.split('/');
    const lastPart = parts[parts.length - 1] || '';
    if (lastPart.includes('?')) {
      return lastPart.split('?')[0];
    }
    return lastPart;
  } catch {
    return cleanUrl;
  }
}

export function normalizeFacebookProfileUrl(handle: string): string {
  if (!handle) return '';
  if (handle.startsWith('http')) return handle;
  return `https://www.facebook.com/${handle}`;
}

export function normalizeInstagramProfileUrl(handle: string): string {
  if (!handle) return '';
  if (handle.startsWith('http')) return handle;
  return `https://www.instagram.com/${handle}`;
}

export function normalizeTikTokProfileUrl(handle: string): string {
  if (!handle) return '';
  if (handle.startsWith('http')) return handle;
  return `https://www.tiktok.com/@${handle.replace(/^@/, '')}`;
}

export function normalizeLinkedInProfileUrl(handle: string): string {
  if (!handle) return '';
  if (handle.startsWith('http')) return handle;
  return `https://www.linkedin.com/in/${handle}`;
}

export function normalizeInstagramDmUrl(handle: string, isIphone?: boolean): string {
  if (!handle) return '';
  const cleanHandle = extractSocialHandle(handle);
  if (isIphone) {
    return `instagram://user?username=${cleanHandle}`;
  }
  return `https://ig.me/m/${cleanHandle}`;
}

export function normalizeMessengerUrl(handle: string, isIphone?: boolean): string {
  if (!handle) return '';
  const cleanHandle = extractSocialHandle(handle);
  if (isIphone) {
    return `fb-messenger://user-thread/${cleanHandle}`;
  }
  return `https://m.me/${cleanHandle}`;
}

