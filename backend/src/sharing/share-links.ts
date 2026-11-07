const MESSAGES = {
  en: { text: 'Hi! Here is my digital business card:', subject: 'My digital business card' },
  ar: { text: 'مرحبًا! إليك بطاقة أعمالي الرقمية:', subject: 'بطاقة أعمالي الرقمية' },
} as const;

export function buildShareLinks(url: string, lang: 'en' | 'ar' = 'en', name?: string) {
  const m = MESSAGES[lang] ?? MESSAGES.en;
  const text = `${m.text}\n${url}`;
  const subject = name ? `${m.subject} — ${name}` : m.subject;
  return {
    url,
    message: text,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
    sms: `sms:?&body=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  };
}
