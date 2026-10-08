/**
 * Utility functions for slugification and URL handling
 */

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // separate accents from letters
    .replace(/[\u0300-\u036f]/g, '') // remove accent diacritics
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // remove leading/trailing hyphens
    .substring(0, 80);
}

export function getEventSlug(event: { id: string; title: string }): string {
  const baseSlug = slugify(event.title) || 'live-show';
  // Include short id segment at end if not already part of slug, to ensure uniqueness
  const shortId = event.id.replace('demo-', '').split('-')[0] || event.id.substring(0, 8);
  return `${baseSlug}-${shortId}`;
}

export function getCitySlug(city?: string): string {
  if (!city || city.trim().length === 0) return 'global';
  return slugify(city);
}

export function getEventUrl(event: { id: string; title: string; city?: string }): string {
  const city = getCitySlug(event.city);
  const slug = getEventSlug(event);
  return `/events/${city}/${slug}`;
}
