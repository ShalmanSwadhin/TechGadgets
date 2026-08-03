export const SITE_NAME = import.meta.env.VITE_STORE_NAME || 'TechGadgets';
// Single source of truth for the brand logo. Swap the file at this path
// (frontend/public/Logo/TGLogo.jpeg) to rebrand the entire app.
export const LOGO_SRC = '/Logo/TGLogo.jpeg';
export const SITE_TAGLINE = import.meta.env.VITE_STORE_TAGLINE || 'Build In Services';
export const SITE_EMAIL = import.meta.env.VITE_STORE_EMAIL || 'hello@techgadgets.store';
export const SITE_PHONE = import.meta.env.VITE_STORE_PHONE || '01300733439';
export const SITE_ADDRESS = import.meta.env.VITE_STORE_ADDRESS || 'Shonir Akhra, Dhaka-1236';

// WhatsApp click-to-chat number in international format (no "+" or spaces).
// Bangladesh country code 880 + local number without the leading 0.
export const SITE_WHATSAPP = import.meta.env.VITE_STORE_WHATSAPP || '8801300733439';

export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/share/1Jd7QUTw72/',
  instagram: 'https://www.instagram.com/tech_gadgets_903?igsh=Y2VxdjA0anh6Nm9u',
};
