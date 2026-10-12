import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface ContactReplyProps {
  ticketId: string;
  senderName?: string;
  replyText: string;
  actionUrl?: string;
  locale?: 'it' | 'en';
}

export function ContactReplyEmail({
  ticketId = 'OS-1024',
  senderName = 'Utente',
  replyText = 'Abbiamo verificato la tua richiesta e aggiornato le informazioni del tuo locale.',
  actionUrl = 'https://openstage.it/contact',
  locale = 'it',
}: ContactReplyProps) {
  const isIt = locale === 'it';

  const title = isIt
    ? `Risposta alla tua richiesta #${ticketId}`
    : `Response to your ticket #${ticketId}`;

  return (
    <BaseEmailLayout
      previewText={title}
      locale={locale}
      showUnsubscribe={false}
    >
      <Heading style={headingStyle}>{title}</Heading>

      <Text style={paragraphStyle}>
        {isIt
          ? `Ciao ${senderName}, il team di OpenStage ha risposto alla tua segnalazione #${ticketId}:`
          : `Hello ${senderName}, the OpenStage support team has responded to your ticket #${ticketId}:`}
      </Text>

      <div style={replyBoxStyle}>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '22px', color: '#FFFFFF', whiteSpace: 'pre-line' }}>
          {replyText}
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={actionUrl} style={mainButtonStyle}>
          {isIt ? 'Visualizza dettagli ticket' : 'View ticket details'}
        </Button>
      </div>

      <Text style={{ fontSize: '12px', color: '#64748B' }}>
        {isIt
          ? 'Ricorda che non puoi rispondere direttamente a questa email. Se hai altre domande, apri un nuovo messaggio sulla pagina Contatti.'
          : 'Please note you cannot reply directly to this email. For further questions, open a new message on the Contact page.'}
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

const replyBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(56, 189, 248, 0.08)',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  borderRadius: '12px',
  padding: '18px',
  margin: '16px 0',
};
