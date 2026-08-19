// This app is fully self-contained — every page, including individual
// treatment detail pages, now lives here. Nothing links out to the old
// static site anymore.
export const WHATSAPP_URL = "https://wa.me/60162130864";

/** A wa.me link pre-filled with a message, so the chat opens with the
 *  customer's intent already typed in. */
export function waLink(message: string, phone: string = "60162130864") {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
