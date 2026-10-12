import * as React from 'react';
import { Text, Heading, Button } from '@react-email/components';
import { BaseEmailLayout, mainButtonStyle } from './BaseEmailLayout';

interface ClaimProfileInviteProps {
  recipientName?: string;
  targetType: 'artist' | 'venue' | 'event';
  targetName: string;
  claimUrl: string;
  locale?: 'it' | 'en';
}

export function ClaimProfileInviteEmail({
  recipientName = 'Artista / Locale',
  targetType = 'artist',
  targetName = 'Nome Profilo',
  claimUrl = 'https://openstage.it/claim?token=sample',
  locale = 'it',
}: ClaimProfileInviteProps) {
  const isIt = locale === 'it';

  const typeLabels = {
    artist: isIt ? 'il tuo profilo artista' : 'your artist profile',
    venue: isIt ? 'la scheda del tuo locale' : 'your venue profile',
    event: isIt ? 'la pagina del tuo concerto' : 'your event page',
  };

  const title = isIt
    ? `Rivendica ${typeLabels[targetType] || 'il tuo profilo'} su OpenStage`
    : `Claim ${typeLabels[targetType] || 'your profile'} on OpenStage`;

  return (
    <BaseEmailLayout
      previewText={title}
      locale={locale}
      showUnsubscribe={false}
    >
      <Heading style={headingStyle}>{title}</Heading>

      <Text style={paragraphStyle}>
        {isIt
          ? `Ciao ${recipientName}, il team di OpenStage ha preparato una scheda dedicata a "${targetName}".`
          : `Hello ${recipientName}, the OpenStage team has created a dedicated page for "${targetName}".`}
      </Text>

      <Text style={paragraphStyle}>
        {isIt
          ? 'Rivendicando la tua pagina potrai personalizzare i dettagli, aggiungere concerti, connetterti con i fan e promuovere la tua musica in piena autonomia e senza costi.'
          : 'By claiming your page you can customize all details, publish shows, connect with local fans, and grow your audience with zero platform fees.'}
      </Text>

      <div style={boxStyle}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
          {isIt ? 'Elemento da rivendicare' : 'Entity to claim'}
        </p>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#38BDF8' }}>
          {targetName} ({targetType.toUpperCase()})
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '28px 0' }}>
        <Button href={claimUrl} style={mainButtonStyle}>
          {isIt ? 'Rivendica subito il tuo profilo' : 'Claim your profile now'}
        </Button>
      </div>

      <Text style={{ fontSize: '12px', color: '#64748B' }}>
        {isIt
          ? "La richiesta di rivendicazione viene verificata manualmente per garantire l'identità autentica di artisti e locali."
          : 'Claim requests are reviewed manually to guarantee verified identities for all artists and venues.'}
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

const boxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(56, 189, 248, 0.08)',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  borderRadius: '12px',
  padding: '16px',
  margin: '16px 0',
};
