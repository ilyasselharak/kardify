import type { BusinessCard } from '../generated/prisma/client.js';

export interface SocialLink {
  platform: string;
  url: string;
  visible?: boolean;
  label?: string;
}

export function publicCardUrl(frontendUrl: string, slug: string) {
  return `${frontendUrl}/card/${slug}`;
}

/** Only fields safe for anonymous visitors. Hidden social links are removed. */
export function toPublicCard(card: BusinessCard, frontendUrl: string) {
  const socialLinks = ((card.socialLinks as unknown as SocialLink[]) ?? []).filter((l) => l.visible !== false);
  return {
    slug: card.slug,
    publicId: card.publicId,
    url: publicCardUrl(frontendUrl, card.slug),
    name: card.name,
    jobTitle: card.jobTitle,
    companyName: card.companyName,
    description: card.description,
    profileImage: card.profileImage,
    companyLogo: card.companyLogo,
    email: card.email,
    phone: card.phone,
    whatsapp: card.whatsapp,
    website: card.website,
    address: card.address,
    mapsUrl: card.mapsUrl,
    socialLinks,
    designSettings: card.designSettings,
    language: card.language,
    updatedAt: card.updatedAt,
  };
}

export type PublicCard = ReturnType<typeof toPublicCard>;
