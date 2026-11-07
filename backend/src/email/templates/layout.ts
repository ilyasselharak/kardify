import type { Language } from '../../generated/prisma/client.js';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function renderEmail(opts: {
  lang: Language;
  heading: string;
  body: string;
  cta: string;
  url: string;
  footer: string;
}): string {
  const dir = opts.lang === 'ar' ? 'rtl' : 'ltr';
  const align = dir === 'rtl' ? 'right' : 'left';
  return `<!doctype html>
<html lang="${opts.lang}" dir="${dir}">
<body style="margin:0;background:#f7f9fc;font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif;color:#0d1e37">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e5eaf1;border-radius:16px;overflow:hidden">
        <tr><td style="background:#0d1e37;padding:20px 28px;text-align:${align}">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px">Kardify</span>
        </td></tr>
        <tr><td style="padding:32px 28px;text-align:${align}" dir="${dir}">
          <h1 style="margin:0 0 12px;font-size:22px;color:#0d1e37">${escapeHtml(opts.heading)}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#64748b">${escapeHtml(opts.body)}</p>
          <a href="${escapeHtml(opts.url)}" style="display:inline-block;background:#006afe;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px">${escapeHtml(opts.cta)}</a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b;word-break:break-all">${escapeHtml(opts.url)}</p>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #e5eaf1;font-size:12px;color:#64748b;text-align:${align}">${escapeHtml(opts.footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
