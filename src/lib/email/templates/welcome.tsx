import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface WelcomeEmailProps {
  name?: string;
  role?: 'fan' | 'artist' | 'venue';
  locale?: 'it' | 'en';
}

export function WelcomeEmail({
  name = 'Amico della musica',
  role = 'fan',
  locale = 'it',
}: WelcomeEmailProps) {
  const isIt = locale === 'it';

  const title = isIt
    ? `Benvenuto su OpenStage, ${name}!`
    : `Welcome to OpenStage, ${name}!`;

  const description = isIt
    ? role === 'artist'
      ? 'Sei pronto a far ascoltare la tua musica dal vivo? Con OpenStage puoi pubblicare i tuoi concerti gratuitamente, connetterti con locali e raggiungere nuovi fan.'
      : role === 'venue'
      ? 'Benvenuto nella community dei locali e organizzatori. Promuovi le tue serate dal vivo, scopri nuovi artisti indipendenti e riempi la tua sala.'
      : 'Sei nel posto giusto per scoprire concerti segreti, live acustici e band emergenti nella tua città. Salva i tuoi eventi preferiti e imposta promemoria per non perdere nessuna data!'
    : role === 'artist'
    ? 'Ready to bring your music live? On OpenStage you can post your gigs for free, connect with venues, and grow your indie fanbase.'
    : role === 'venue'
    ? 'Welcome to the organizer network. Promote your live gigs, discover indie talents, and pack the venue with real live lovers.'
    : 'You are now ready to discover hidden gigs, underground performances, and indie acts in your city. Save your favorite shows and set reminders!';

  const buttonText = isIt
    ? role === 'artist' || role === 'venue'
      ? 'Crea il tuo primo evento'
      : 'Esplora i concerti'
    : role === 'artist' || role === 'venue'
    ? 'Post your first gig'
    : 'Explore live shows';

  const buttonUrl =
    role === 'artist' || role === 'venue'
      ? 'https://openstage.it/events/new'
      : 'https://openstage.it/explore';

  return (
    <BaseEmailLayout
      previewText={title}
      locale={locale}
      showUnsubscribe={true}
    >
      <Heading style={headingStyle}>{title}</Heading>
      <Text style={paragraphStyle}>{description}</Text>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={buttonUrl} style={mainButtonStyle}>
          {buttonText}
        </Button>
      </div>

      <Text style={noteStyle}>
        {isIt
          ? 'Suggerimento: visita la tua Area Personale per personalizzare la tua città di riferimento e i tuoi generi preferiti.'
          : 'Tip: visit your Dashboard to customize your home city and favorite musical genres.'}
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

const noteStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#94A3B8',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  padding: '12px 16px',
  borderRadius: '8px',
  margin: '16px 0 0 0',
};
