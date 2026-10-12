import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface ContactTicketConfirmationProps {
  ticketId: string;
  subject: string;
  senderName?: string;
  messagePreview?: string;
  ticketUrl?: string;
  locale?: 'it' | 'en';
}

export function ContactTicketConfirmationEmail({
  ticketId = 'OS-1024',
  subject = 'Richiesta informazioni evento',
  senderName = 'Utente',
  messagePreview = 'Vorrei sapere come collegare il mio profilo locale.',
  ticketUrl = 'https://openstage.it/contact',
  locale = 'it',
}: ContactTicketConfirmationProps) {
  const isIt = locale === 'it';

  const title = isIt
    ? `Abbiamo ricevuto la tua richiesta #${ticketId}`
    : `We received your ticket #${ticketId}`;

  return (
    <BaseEmailLayout
      previewText={title}
      locale={locale}
      showUnsubscribe={false}
    >
      <Heading style={headingStyle}>{title}</Heading>

      <Text style={paragraphStyle}>
        {isIt
          ? `Ciao ${senderName}, grazie per averci contattato. Il tuo messaggio è stato preso in carico dal nostro team di supporto con il numero di riferimento #${ticketId}.`
          : `Hello ${senderName}, thanks for reaching out. Your request has been assigned ticket #${ticketId} and queued for our support team.`}
      </Text>

      <div style={ticketBoxStyle}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
          {isIt ? 'Oggetto richiesta' : 'Ticket subject'}
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
          {subject}
        </p>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
          {isIt ? 'Estratto messaggio' : 'Message excerpt'}
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', fontStyle: 'italic' }}>
          "{messagePreview}"
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={ticketUrl} style={mainButtonStyle}>
          {isIt ? 'Vai al Centro Assistenza' : 'Go to Help Center'}
        </Button>
      </div>

      <Text style={{ fontSize: '12px', color: '#64748B' }}>
        {isIt
          ? 'Rispondiamo normalmente entro 24 ore lavorative. Ti ricontatteremo a questo stesso indirizzo email.'
          : 'We normally respond within 24 business hours. We will reply back to this email address.'}
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

const ticketBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px',
  margin: '16px 0',
};
