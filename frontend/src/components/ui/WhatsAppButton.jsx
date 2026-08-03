import { FaWhatsapp } from 'react-icons/fa';
import { SITE_WHATSAPP } from '../../config/site';

/**
 * Floating WhatsApp click-to-chat button.
 * Sits above the mobile bottom navigation and below the cart drawer
 * (z-40 < cart backdrop z-[60]) so it never obstructs important UI.
 */
export default function WhatsAppButton() {
  const href = `https://wa.me/${SITE_WHATSAPP}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1ebe5d] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60 md:bottom-6 md:right-6 md:h-12 md:w-12"
    >
      <FaWhatsapp className="text-2xl md:text-[26px]" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 md:block">
        Chat with us
      </span>
    </a>
  );
}
