import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface AdminAlertProps {
  alertType: 'radio_review' | 'venue_verification' | 'event_report' | 'payment_failed' | 'mail_failed';
  title: string;
  message: string;
  actionUrl?: string;
  locale?: 'it' | 'en';
}

export function AdminAlertEmail({
  alertType = 'event_report',
  title = 'Nuova notifica amministratore',
  message = 'È richiesta la tua attenzione su un elemento della piattaforma.',
  actionUrl = 'https://openstage.it/admin',
  locale = 'it',
}: AdminAlertProps) {
  const isIt = locale === 'it';

  const typeLabels = {
    radio_review: isIt ? 'Brano radio da approvare' : 'Radio track review',
    venue_verification: isIt ? 'Verifica locale richiesta' : 'Venue verification request',
    event_report: isIt ? 'Segnalazione evento' : 'Event report alert',
    payment_failed: isIt ? 'Pagamento fallito' : 'Payment failure',
    mail_failed: isIt ? 'Email non recapitata' : 'Failed email alert',
  };

  const badgeText = typeLabels[alertType] || 'Avviso di sistema';

  return (
    <BaseEmailLayout
      previewText={`[OpenStage Admin] ${title}`}
      locale={locale}
      showUnsubscribe={false}
    >
      <div style={badgeContainerStyle}>
        <span style={badgeStyle}>{badgeText.toUpperCase()}</span>
      </div>

      <Heading style={headingStyle}>{title}</Heading>

      <div style={messageBoxStyle}>
        <Text style={{ margin: 0, fontSize: '14px', lineHeight: '22px', color: '#F8FAFC', whiteSpace: 'pre-line' }}>
          {message}
        </Text>
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={actionUrl} style={mainButtonStyle}>
          {isIt ? 'Accedi al Pannello Admin' : 'Open Admin Panel'}
        </Button>
      </div>

      <Text style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
        {isIt
          ? 'Questa notifica è inviata solo per eventi prioritari (brani radio, verifiche locali, segnalazioni ed errori critici).'
          : 'This alert is sent only for critical events (radio tracks, venue verification, event reports, critical failures).'}
      </Text>
    </BaseEmailLayout>
  );
}

const badgeContainerStyle: React.CSSProperties = {
  marginBottom: '12px',
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  border: '1px solid rgba(239, 68, 68, 0.4)',
  borderRadius: '6px',
  color: '#F87171',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.05em',
  padding: '4px 8px',
  display: 'inline-block',
};

const headingStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#FFFFFF',
  marginBottom: '16px',
};

const messageBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '12px',
  padding: '16px',
  margin: '16px 0',
};
