/** Share URLs for a public CV link (built client-side; no tracking parameters). */
export function cvShareLinks(url: string, name: string) {
  const text = name ? `${name} — CV` : "CV";
  const e = encodeURIComponent;
  return {
    whatsapp: `https://wa.me/?text=${e(`${text}: ${url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`,
    x: `https://twitter.com/intent/tweet?url=${e(url)}&text=${e(text)}`,
    email: `mailto:?subject=${e(text)}&body=${e(url)}`,
  };
}
