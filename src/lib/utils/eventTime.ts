/**
 * Utilities to handle event times in their respective timezones
 */

export function formatEventDateTime(
  isoString: string,
  timeZone = 'UTC',
  locale = 'en-US'
): {
  dateStr: string;
  timeStr: string;
  fullStr: string;
  timezoneLabel: string;
} {
  try {
    const date = new Date(isoString);

    const dateStr = new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);

    const timeStr = new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);

    // Short timezone code, e.g., CEST, GMT, JST
    const tzName = new Intl.DateTimeFormat(locale, {
      timeZone,
      timeZoneName: 'short',
    })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value || timeZone;

    return {
      dateStr,
      timeStr,
      fullStr: `${dateStr} • ${timeStr} (${tzName})`,
      timezoneLabel: tzName,
    };
  } catch {
    // Fallback if timezone string is invalid
    const date = new Date(isoString);
    return {
      dateStr: date.toLocaleDateString(),
      timeStr: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullStr: date.toLocaleString(),
      timezoneLabel: timeZone,
    };
  }
}

/**
 * Checks if an event qualifies for quick filter buttons based on its own timezone.
 */
export function matchesQuickTimeFilter(
  isoString: string,
  timeZone = 'UTC',
  filter: 'tonight' | 'this_weekend' | 'this_week' | 'next_30_days'
): boolean {
  try {
    const eventDate = new Date(isoString);
    const now = new Date();

    if (eventDate < now) return false;

    // Get event's local year, month, day, hours, weekday
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(eventDate);
    const eventYear = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
    const eventMonth = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10);
    const eventDay = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
    const eventHour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const eventWeekday = parts.find((p) => p.type === 'weekday')?.value; // 'Mon', 'Tue', etc.

    // Get "now" in the SAME event timezone to compare apples to apples
    const nowParts = formatter.formatToParts(now);
    const nowYear = parseInt(nowParts.find((p) => p.type === 'year')?.value || '0', 10);
    const nowMonth = parseInt(nowParts.find((p) => p.type === 'month')?.value || '0', 10);
    const nowDay = parseInt(nowParts.find((p) => p.type === 'day')?.value || '0', 10);

    const isSameDay =
      eventYear === nowYear && eventMonth === nowMonth && eventDay === nowDay;

    // Difference in milliseconds
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (filter === 'tonight') {
      // Same day evening (>= 17:00) or up to tomorrow early morning (<= 05:00) within 18 hours
      return (
        (isSameDay && eventHour >= 17) ||
        (diffDays < 1 && diffDays >= 0 && eventHour >= 18)
      );
    }

    if (filter === 'this_weekend') {
      // Friday (Fri from 17:00), Saturday (Sat), or Sunday (Sun) within 7 days
      const isWeekendDay =
        eventWeekday === 'Sat' ||
        eventWeekday === 'Sun' ||
        (eventWeekday === 'Fri' && eventHour >= 17);
      return isWeekendDay && diffDays <= 7;
    }

    if (filter === 'this_week') {
      return diffDays <= 7;
    }

    if (filter === 'next_30_days') {
      return diffDays <= 30;
    }

    return true;
  } catch {
    return true;
  }
}
