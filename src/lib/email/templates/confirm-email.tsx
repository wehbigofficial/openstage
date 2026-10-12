import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface ConfirmEmailProps {
  confirmUrl?: string;
  name?: string;
  locale?: 'it' | 'en';
}

export function ConfirmEmail({
  confirmUrl = 'https://openstage.it/auth/callback',
  name = 'Utente',
  locale = 'it',
}: ConfirmEmailProps) {
  const isIt = locale === 'it';

  const title = isIt
    ? 'Conferma il tuo indirizzo email su OpenStage'
    : 'Confirm your email address on OpenStage';

  const preview = isIt
    ? 'Completa la verifica per attivare il tuo profilo OpenStage'
    : 'Complete verification to activate your OpenStage profile';

  return (
    <BaseEmailLayout
      previewText={preview}
      locale={locale}
      showUnsubscribe={false} // Transactional email
    >
      <Heading style={headingStyle}>{title}</Heading>
      <Text style={paragraphStyle}>
        {isIt
          ? `Ciao ${name}, grazie per esserti registrato su OpenStage. Per verificare la tua identità e pubblicare o salvare concerti, fai clic sul pulsante qui sotto:`
          : `Hello ${name}, thank you for registering with OpenStage. To verify your email and activate your account, click the button below:`}
      </Text>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={confirmUrl} style={mainButtonStyle}>
          {isIt ? 'Conferma il mio account' : 'Confirm my account'}
        </Button>
      </div>

      <Text style={subTextStyle}>
        {isIt
          ? 'Se non hai creato un account su OpenStage, puoi ignorare questa email in tutta sicurezza.'
          : 'If you did not create an account on OpenStage, you can safely ignore this email.'}
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

const subTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748B',
  marginTop: '20px',
  lineHeight: '18px',
};
