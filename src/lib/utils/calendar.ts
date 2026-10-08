/**
 * Calendar helpers for Google Calendar link & iCalendar (.ics) download
 */

export function getGoogleCalendarUrl(event: {
  title: string;
  description?: string;
  venue_name: string;
  address?: string;
  city?: string;
  starts_at: string;
}): string {
  const startDate = new Date(event.starts_at);
  // Default end time 3 hours after start if not provided
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatUtc = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const datesParam = `${formatUtc(startDate)}/${formatUtc(endDate)}`;
  const location = `${event.venue_name || ''}, ${event.address || event.city || ''}`.trim();
  const details = `${event.description || ''}\n\nInfo on OpenStage: https://openstage.live`.trim();

  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', event.title);
  url.searchParams.set('dates', datesParam);
  url.searchParams.set('details', details);
  url.searchParams.set('location', location);

  return url.toString();
}

export function downloadIcsFile(event: {
  id: string;
  title: string;
  description?: string;
  venue_name: string;
  address?: string;
  city?: string;
  starts_at: string;
}) {
  const startDate = new Date(event.starts_at);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatUtc = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const location = `${event.venue_name || ''}, ${event.address || event.city || ''}`.trim();
  const summary = event.title.replace(/\n/g, ' ');
  const description = (event.description || '').replace(/\n/g, '\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpenStage//Live Events//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:openstage-${event.id}@openstage.live`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(startDate)}`,
    `DTEND:${formatUtc(endDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
