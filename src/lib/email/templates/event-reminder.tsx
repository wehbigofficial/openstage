import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface EventReminderProps {
  timing: 'day_before' | 'morning_of';
  eventTitle: string;
  artistName: string;
  venueName: string;
  address?: string;
  eventDate: string;
  eventUrl?: string;
  locale?: 'it' | 'en';
}

export function EventReminderEmail({
  timing = 'day_before',
  eventTitle = 'Concerto Live',
  artistName = 'Artista',
  venueName = 'Club OpenStage',
  address = 'Via Roma 1, Milano',
  eventDate = 'Sabato 12 Ottobre, ore 21:00',
  eventUrl = 'https://openstage.it/explore',
  locale = 'it',
}: EventReminderProps) {
  const isIt = locale === 'it';
  const isDayBefore = timing === 'day_before';

  const title = isIt
    ? isDayBefore
      ? `Promemoria: Domani c'è ${artistName} dal vivo!`
      : `Stasera tocca a ${artistName}! Sei pronto?`
    : isDayBefore
    ? `Reminder: ${artistName} live tomorrow!`
    : `Tonight: ${artistName} is performing!`;

  return (
    <BaseEmailLayout
      previewText={title}
      locale={locale}
      showUnsubscribe={true}
    >
      <Heading style={headingStyle}>{title}</Heading>

      <Text style={paragraphStyle}>
        {isIt
          ? isDayBefore
            ? `Ti ricordiamo che domani sera andrà in scena "${eventTitle}" di ${artistName}. Ecco il riepilogo per organizzare la tua serata:`
            : `Ci siamo! Questa sera andrà in scena "${eventTitle}". Ecco tutti i dettagli per arrivare in orario:`
          : isDayBefore
          ? `Friendly reminder that tomorrow night is "${eventTitle}" featuring ${artistName}. Here are the details:`
          : `The wait is over! Tonight "${eventTitle}" goes live. Here is everything you need:`}
      </Text>

      {/* Gig details card */}
      <div style={gigCardStyle}>
        <p style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
          {eventTitle}
        </p>
        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#38BDF8', fontWeight: 600 }}>
          🎤 {artistName}
        </p>
        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#F1F5F9' }}>
          📅 {eventDate}
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
          📍 {venueName} — {address}
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={eventUrl} style={mainButtonStyle}>
          {isIt ? 'Dettagli e biglietti' : 'Event details & tickets'}
        </Button>
      </div>

      <Text style={{ fontSize: '13px', color: '#94A3B8' }}>
        {isIt
          ? 'Condividi l’evento con i tuoi amici o scarica il promemoria nel calendario direttamente dalla pagina dell’evento.'
          : 'Share the show with your friends or download the calendar invite directly from the event page.'}
      </Text>
    </BaseEmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#FFFFFF',
  marginBottom: '16px',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#CBD5E1',
  marginBottom: '16px',
};

const gigCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '18px',
  margin: '18px 0',
};
