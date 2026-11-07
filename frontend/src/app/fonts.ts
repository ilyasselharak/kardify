import { Cairo, IBM_Plex_Sans_Arabic, Inter, Montserrat, Playfair_Display, Poppins, Tajawal } from "next/font/google";

/** UI fonts: Inter (Latin) + IBM Plex Sans Arabic for Arabic glyphs. */
export const uiLatin = Inter({ subsets: ["latin"], variable: "--font-card-inter", display: "swap" });
export const uiArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui-arabic",
  display: "swap",
});

/** Card design fonts (lazy-loaded by the browser only when used). */
export const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-card-poppins", display: "swap" });
export const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-card-playfair", display: "swap" });
export const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-card-montserrat", display: "swap" });
export const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-card-cairo", display: "swap" });
export const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-card-tajawal", display: "swap" });

export const fontVariables = [uiLatin, uiArabic, poppins, playfair, montserrat, cairo, tajawal].map((f) => f.variable).join(" ");
