import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface DigestEventItem {
  id: string;
  title: string;
  artistName: string;
  venueName: string;
  city: string;
  dateStr: string;
  genre: string;
  url: string;
}

interface WeeklyDigestProps {
  fanName?: string;
  city?: string;
  followedEvents?: DigestEventItem[];
  cityEvents?: DigestEventItem[];
  digestUrl?: string;
  locale?: 'it' | 'en';
}

export function WeeklyDigestEmail({
  fanName = 'Fan',
  city = 'Milano',
  followedEvents = [],
  cityEvents = [],
  digestUrl = 'https://openstage.it/dashboard',
  locale = 'it',
}: WeeklyDigestProps) {
  const isIt = locale === 'it';

  const title = isIt
    ? `I tuoi concerti per la settimana a ${city} e oltre`
    : `Your weekly gig guide for ${city} and beyond`;

  return (
    <BaseEmailLayout
      previewText={title}
      locale={locale}
      showUnsubscribe={true}
    >
      <Heading style={headingStyle}>{title}</Heading>

      <Text style={paragraphStyle}>
        {isIt
          ? `Ciao ${fanName}, ecco il tuo riepilogo settimanale con i nuovi concerti annunciati dagli artisti e locali che segui, più le migliori date in arrivo a ${city}:`
          : `Hello ${fanName}, here is your weekly live music roundup with new shows from artists and venues you follow, plus top upcoming gigs in ${city}:`}
      </Text>

      {/* Followed section */}
      {followedEvents.length > 0 && (
        <div style={{ margin: '16px 0' }}>
          <p style={sectionHeaderStyle}>
            {isIt ? '⭐ Dai profili che segui' : '⭐ From acts you follow'}
          </p>
          {followedEvents.slice(0, 3).map((item) => (
            <div key={item.id} style={eventRowStyle}>
              <p style={{ margin: '0 0 2px 0', fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>
                {item.title}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                🎤 {item.artistName} • 📍 {item.venueName} ({item.city})
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#38BDF8' }}>
                📅 {item.dateStr}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* In your city section */}
      {cityEvents.length > 0 && (
        <div style={{ margin: '16px 0' }}>
          <p style={sectionHeaderStyle}>
            {isIt ? `📍 Nuovi concerti a ${city}` : `📍 New gigs in ${city}`}
          </p>
          {cityEvents.slice(0, 4).map((item) => (
            <div key={item.id} style={eventRowStyle}>
              <p style={{ margin: '0 0 2px 0', fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>
                {item.title}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                🎤 {item.artistName} • 📍 {item.venueName}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#A855F7' }}>
                📅 {item.dateStr} • {item.genre}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={digestUrl} style={mainButtonStyle}>
          {isIt ? 'Scopri tutti gli eventi' : 'Discover all shows'}
        </Button>
      </div>

      <Text style={{ fontSize: '12px', color: '#64748B', lineHeight: '18px' }}>
        {isIt
          ? 'Ricevi questa email perché hai prestato il consenso al digest settimanale. Puoi modificare la tua città o disiscriverti in qualsiasi momento nelle Impostazioni.'
          : 'You are receiving this email because you opted into the weekly digest. You can change your city or unsubscribe anytime in Settings.'}
      </Text>
    </BaseEmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#FFFFFF',
  marginBottom: '16px',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#CBD5E1',
  marginBottom: '16px',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#38BDF8',
  margin: '16px 0 8px 0',
};

const eventRowStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '10px',
  padding: '12px 14px',
  marginBottom: '8px',
};
