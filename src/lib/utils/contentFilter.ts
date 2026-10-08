/**
 * Anti-abuse content filter: blocked words, spam links, max daily events
 */

export const BANNED_WORDS = [
  'casino',
  'viagra',
  'crypto pump',
  'free tokens',
  'whatsapp money',
  'telegram loan',
  'adult webcam',
  'porn',
  'xxx',
  'warez',
  'crack software',
  'buy followers',
  'escort service',
  'payday loan',
];

export const SPAM_LINK_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  't.me',
  'wa.me',
  'cutt.ly',
  'is.gd',
  'shorturl.at',
  'ouo.io',
  'adf.ly',
];

export function validateEventContent(content: {
  title: string;
  description?: string;
  links?: Record<string, string>;
  ticket_url?: string;
}): { valid: boolean; reason?: string } {
  const combinedText = `${content.title} ${content.description || ''}`.toLowerCase();

  for (const word of BANNED_WORDS) {
    if (combinedText.includes(word.toLowerCase())) {
      return {
        valid: false,
        reason: `Contenuto non consentito rilevato: termine "${word}" vietato dalle linee guida della community.`,
      };
    }
  }

  const allUrls = [
    content.ticket_url,
    ...(content.links ? Object.values(content.links) : []),
  ].filter(Boolean) as string[];

  for (const urlStr of allUrls) {
    try {
      const parsed = new URL(urlStr);
      const hostname = parsed.hostname.toLowerCase();
      if (SPAM_LINK_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
        return {
          valid: false,
          reason: `I link accorciati o sospetti (${hostname}) non sono ammessi. Inserisci URL diretti dei canali ufficiali o dei ticket provider.`,
        };
      }
    } catch {
      // ignore invalid URL format here, let standard URL validation handle it if needed
    }
  }

  return { valid: true };
}
