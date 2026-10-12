import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface EventChangedOrCancelledProps {
  eventTitle: string;
  artistName?: string;
  changeType: 'cancelled' | 'rescheduled' | 'venue_changed' | 'updated';
  changeDescription: string;
  eventUrl?: string;
  locale?: 'it' | 'en';
}

export function EventChangedOrCancelledEmail({
  eventTitle = 'Concerto Live',
  artistName = 'Artista',
  changeType = 'cancelled',
  changeDescription = 'L’evento è stato annullato per cause impreviste.',
  eventUrl = 'https://openstage.it/explore',
  locale = 'it',
}: EventChangedOrCancelledProps) {
  const isIt = locale === 'it';

  const isCancelled = changeType === 'cancelled';

  const title = isIt
    ? isCancelled
      ? `ATTENZIONE: Concerto annullato - ${eventTitle}`
      : `Importante aggiornamento per il concerto - ${eventTitle}`
    : isCancelled
    ? `ATTENTION: Event cancelled - ${eventTitle}`
    : `Important update regarding ${eventTitle}`;

  return (
    <BaseEmailLayout
      previewText={title}
      locale={locale}
      showUnsubscribe={true}
    >
      <Heading style={{ ...headingStyle, color: isCancelled ? '#F43F5E' : '#38BDF8' }}>
        {title}
      </Heading>

      <Text style={paragraphStyle}>
        {isIt
          ? `Hai salvato o impostato un promemoria per il concerto di ${artistName} ("${eventTitle}"). L'organizzatore ha pubblicato un aggiornamento importante:`
          : `You saved or set a reminder for ${artistName} ("${eventTitle}"). The organizer has published an important update:`}
      </Text>

      <div style={noticeBoxStyle(isCancelled)}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>
          {isIt ? 'Dettagli della modifica:' : 'Update details:'}
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', lineHeight: '20px', color: '#F1F5F9' }}>
          {changeDescription}
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={eventUrl} style={mainButtonStyle}>
          {isIt ? 'Vedi dettagli evento' : 'View event details'}
        </Button>
      </div>

      <Text style={{ fontSize: '13px', color: '#94A3B8' }}>
        {isIt
          ? 'Ti consigliamo di verificare la pagina ufficiale dell’evento o contattare direttamente il locale prima di recarti sul posto.'
          : 'We recommend checking the official event page or contacting the venue directly before heading out.'}
      </Text>
    </BaseEmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  marginBottom: '16px',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#CBD5E1',
  marginBottom: '16px',
};

const noticeBoxStyle = (isCancelled: boolean): React.CSSProperties => ({
  backgroundColor: isCancelled ? 'rgba(244, 63, 94, 0.12)' : 'rgba(56, 189, 248, 0.12)',
  border: `1px solid ${isCancelled ? 'rgba(244, 63, 94, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
  borderRadius: '12px',
  padding: '16px',
  margin: '16px 0',
});
