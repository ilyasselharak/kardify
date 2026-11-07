import QRCode from "qrcode";

/** Client-side QR for previews (drafts have no public QR endpoint yet). */
export function qrDataUrl(text: string, dark = "#0d1e37", light = "#ffffff") {
  return QRCode.toDataURL(text, { margin: 1, width: 320, errorCorrectionLevel: "M", color: { dark, light } });
}
