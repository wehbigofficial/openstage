import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface EventReceivedEmailProps {
  eventTitle: string;
  eventDate: string;
  venueName?: string;
  eventUrl?: string;
  locale?: 'it' | 'en';
}

export function EventReceivedEmail({
  eventTitle = 'Concerto Live',
  eventDate = 'Sabato 12 Ottobre, ore 21:00',
  venueName = 'OpenStage Arena',
  eventUrl = 'https://openstage.it/dashboard',
  locale = 'it',
}: EventReceivedEmailProps) {
  const isIt = locale === 'it';

  const title = isIt
    ? 'Il tuo evento è stato ricevuto!'
    : 'Your event has been received!';

  return (
    <BaseEmailLayout
      previewText={`${eventTitle} - ${title}`}
      locale={locale}
      showUnsubscribe={false}
    >
      <Heading style={headingStyle}>{title}</Heading>
      <Text style={paragraphStyle}>
        {isIt
          ? `Abbiamo ricevuto con successo il tuo concerto "${eventTitle}". È ora registrato sulla piattaforma e visibile ai fan!`
          : `We have successfully received your gig "${eventTitle}". It is now registered on OpenStage and discoverable by fans!`}
      </Text>

      <div style={detailBoxStyle}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#FFFFFF', fontSize: '15px' }}>
          {eventTitle}
        </p>
        <p style={{ margin: '0 0 4px 0', color: '#38BDF8', fontSize: '13px' }}>
          📅 {eventDate}
        </p>
        <p style={{ margin: 0, color: '#CBD5E1', fontSize: '13px' }}>
          📍 {venueName}
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={eventUrl} style={mainButtonStyle}>
          {isIt ? 'Visualizza evento' : 'View event'}
        </Button>
      </div>

      <Text style={paragraphStyle}>
        {isIt
          ? 'Puoi modificare i dettagli o aggiungere locandina e link biglietti in qualsiasi momento dalla tua dashboard.'
          : 'You can update details, banner imagery, or ticket links anytime from your dashboard.'}
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
  marginBottom: '20px',
};

const detailBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px',
  margin: '16px 0',
};
