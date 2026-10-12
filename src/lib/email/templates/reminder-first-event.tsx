import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface ReminderFirstEventProps {
  name?: string;
  createUrl?: string;
  locale?: 'it' | 'en';
}

export function ReminderFirstEventEmail({
  name = 'Artista',
  createUrl = 'https://openstage.it/events/new',
  locale = 'it',
}: ReminderFirstEventProps) {
  const isIt = locale === 'it';

  const title = isIt
    ? 'Il palco ti aspetta: pubblica il tuo primo evento!'
    : 'The stage awaits: publish your first event!';

  return (
    <BaseEmailLayout
      previewText={title}
      locale={locale}
      showUnsubscribe={true}
    >
      <Heading style={headingStyle}>{title}</Heading>
      <Text style={paragraphStyle}>
        {isIt
          ? `Ciao ${name}, sono passati pochi giorni dalla tua iscrizione su OpenStage e abbiamo notato che non hai ancora pubblicato il tuo primo concerto.`
          : `Hello ${name}, it has been a few days since you joined OpenStage and we noticed you haven't published your first gig yet.`}
      </Text>

      <Text style={paragraphStyle}>
        {isIt
          ? 'Bastano solo 2 minuti per inserire data, luogo e locandina. Pubblicare su OpenStage è completamente gratuito e ti aiuta a far scoprire la tua musica dal vivo a nuovi fan nella tua zona!'
          : 'It takes just 2 minutes to add your date, location, and poster. Posting on OpenStage is 100% free and puts your gig in front of local music lovers!'}
      </Text>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button href={createUrl} style={mainButtonStyle}>
          {isIt ? 'Crea il tuo evento ora' : 'Post your event now'}
        </Button>
      </div>

      <Text style={{ fontSize: '13px', color: '#94A3B8' }}>
        {isIt
          ? 'Hai domande o dubbi? Puoi contattarci in qualsiasi momento tramite la nostra pagina Contatti.'
          : 'Got questions? Feel free to reach out anytime via our Contact page.'}
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
