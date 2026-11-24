import QRCode from 'qrcode';

export function buildMenuUrl(
  origin: string,
  slug: string,
  options?: { branch?: string; table?: string; qr?: boolean }
): string {
  const safeSlug = encodeURIComponent(slug || 'du-an-mau');
  const params = new URLSearchParams();
  if (options?.qr !== false) params.set('qr', '1');
  if (options?.branch?.trim()) params.set('branch', options.branch.trim());
  if (options?.table?.trim()) params.set('table', options.table.trim());
  const qs = params.toString();
  const base = origin.replace(/\/$/, '');
  return `${base}/menu/${safeSlug}${qs ? `?${qs}` : ''}`;
}

export async function generateQrPngDataUrl(url: string, width = 512): Promise<string> {
  return QRCode.toDataURL(url, {
    width,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

export async function generateQrSvgString(url: string, width = 512): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    width,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

export function triggerDownloadDataUrl(filename: string, dataUrl: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
