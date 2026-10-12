import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface EventHiddenOrRejectedProps {
  eventTitle: string;
  reason: string;
  actionUrl?: string;
  isRejected?: boolean;
  locale?: 'it' | 'en';
}

export function EventHiddenOrRejectedEmail({
  eventTitle = 'Il tuo concerto',
  reason = 'Mancanza di informazioni complete sull’indirizzo o sui dettagli della line-up.',
  actionUrl = 'https://openstage.it/dashboard/events',
  isRejected = false,
  locale = 'it',
}: EventHiddenOrRejectedProps) {
  const isIt = locale === 'it';

  const title = isIt
    ? isRejected
      ? `Il tuo evento "${eventTitle}" non è stato approvato`
      : `Il tuo evento "${eventTitle}" è stato nascosto temporaneamente`
    : isRejected
    ? `Your event "${eventTitle}" was not approved`
    : `Your event "${eventTitle}" was temporarily hidden`;

  return (
    <BaseEmailLayout
      previewText={title}
      locale={locale}
      showUnsubscribe={false}
    >
      <Heading style={headingStyle}>{title}</Heading>
      <Text style={paragraphStyle}>
        {isIt
          ? `Ti informiamo che il tuo evento "${eventTitle}" non è al momento visibile pubblicamente per il seguente motivo:`
          : `We are writing to let you know that your event "${eventTitle}" is currently not visible publicly for the following reason:`}
      </Text>

      <div style={reasonBoxStyle}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#F43F5E', fontWeight: 700 }}>
          {isIt ? 'Motivo segnalato' : 'Reason specified'}
        </span>
        <p style={{ margin: '8px 0 0 0', color: '#FFFFFF', fontSize: '14px', lineHeight: '20px' }}>
          {reason}
        </p>
      </div>

      <Text style={paragraphStyle}>
        {isIt
          ? 'Puoi revisionare e aggiornare le informazioni dalla tua dashboard per richiedere la ripubblicazione immediata:'
          : 'You can review and edit event details in your dashboard to request immediate reactivation:'}
      </Text>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={actionUrl} style={mainButtonStyle}>
          {isIt ? 'Modifica evento' : 'Edit event'}
        </Button>
      </div>

      <Text style={{ fontSize: '12px', color: '#94A3B8' }}>
        {isIt
          ? 'Se ritieni che ci sia stato un errore, puoi aprire un ticket nella sezione Contatti.'
          : 'If you believe this was done in error, please open a ticket on our Contact page.'}
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

const reasonBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(244, 63, 94, 0.1)',
  border: '1px solid rgba(244, 63, 94, 0.3)',
  borderRadius: '12px',
  padding: '16px',
  margin: '16px 0 20px 0',
};
