import React from 'react';
import { BaseEmailLayout } from './BaseEmailLayout';

interface ReferralRewardUnlockedProps {
  artistName: string;
  locale?: 'it' | 'en';
}

export function ReferralRewardUnlocked({ artistName, locale = 'it' }: ReferralRewardUnlockedProps) {
  const isIt = locale === 'it';
  
  const t = {
    preheader: isIt ? 'Hai sbloccato Artist Pro gratis grazie ai tuoi inviti!' : 'You unlocked Artist Pro free thanks to your referrals!',
    title: isIt ? 'Complimenti! 🎉 Artist Pro è tuo gratis per sempre' : 'Congrats! 🎉 Artist Pro is yours free forever',
    subtitle: isIt ? 'Hai raggiunto 3 artisti qualificati tramite il programma inviti' : 'You reached 3 qualified artists through the referral program',
    greeting: isIt ? `Ciao <strong>${artistName}</strong>,` : `Hi <strong>${artistName}</strong>,`,
    congrats: isIt
      ? 'Fantastica notizia: <strong>hai sbloccato Artist Pro gratuitamente per sempre!</strong> 🎁'
      : 'Amazing news: <strong>you\'ve unlocked Artist Pro for free forever!</strong> 🎁',
    thanks: isIt
      ? 'Grazie per aver invitato i tuoi colleghi musicisti su OpenStage. Il tuo codice invito ha portato 3 artisti che hanno verificato l\'email e pubblicato il loro primo concerto. Questo è esattamente lo spirito della community che vogliamo costruire.'
      : 'Thanks for inviting your fellow musicians to OpenStage. Your invite code brought 3 artists who verified their email and published their first gig. That\'s exactly the community spirit we want to build.',
    badgeTitle: isIt ? 'Artist Pro Sbloccato Gratis' : 'Artist Pro Unlocked Free',
    badgeValue: isIt ? 'Valore: €3 una tantum — ora tuo per sempre' : 'Value: €3 one-time — now yours forever',
    featuresTitle: isIt ? 'Cosa hai ora (gratis per sempre):' : 'What you have now (free forever):',
    features: isIt ? [
      'Bio page ufficiale completa (copertina, galleria, video, player, archivio)',
      'Rotazione su OpenStage Radio 24/7 (carica fino a 3 brani MP3)',
      'Statistiche avanzate: grafici, città dei fan, ascolti radio, click biglietti',
      'Share card grafiche pulite senza logo OpenStage',
      'Priorità per gli slot In Evidenza in homepage',
      'Candidature dirette alle call dei locali partner (Venue Pro)',
    ] : [
      'Complete official bio page (cover, gallery, videos, player, archive)',
      'Rotation on OpenStage Radio 24/7 (upload up to 3 MP3 tracks)',
      'Advanced stats: charts, fan cities, radio plays, ticket clicks',
      'Clean share cards without OpenStage logo',
      'Priority for Featured slots on homepage',
      'Direct applications to partner venue calls (Venue Pro)',
    ],
    ctaText: isIt ? 'Vai alla Dashboard →' : 'Go to Dashboard →',
    note: isIt
      ? 'Puoi continuare a invitare artisti: non c\'è limite al numero di inviti, e il tuo Pro resta attivo per sempre.'
      : 'You can keep inviting artists: no limit on invites, and your Pro stays active forever.',
    footer: isIt
      ? 'OpenStage — La piattaforma indipendente per la musica dal vivo<br /><a href="https://openstage.live/contact" style={{ color: \'#8b5cf6\' }}>Contattaci</a> se hai domande.'
      : 'OpenStage — Independent live music platform<br /><a href="https://openstage.live/contact" style={{ color: \'#8b5cf6\' }}>Contact us</a> if you have questions.',
  };

  return (
    <BaseEmailLayout
      previewText={t.preheader}
      preheader={t.preheader}
      title={t.title}
      subtitle={t.subtitle}
    >
      <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '24px' }}>
        {t.greeting}
      </p>
      
      <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '24px' }}>
        {t.congrats}
      </p>

      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', borderRadius: '16px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
        <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '22px' }}>{t.badgeTitle}</h3>
        <p style={{ color: '#fff', margin: 0, fontSize: '16px' }}>{t.badgeValue}</p>
      </div>

      <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '24px' }}>
        {t.thanks}
      </p>

      <div style={{ background: 'linear-gradient(135deg, #1e1b2e 0%, #0f0f1a 100%)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ color: '#f59e0b', margin: '0 0 12px', fontSize: '16px' }}>{t.featuresTitle}</h4>
        <ul style={{ color: '#e2e8f0', margin: 0, paddingLeft: '20px', lineHeight: '2' }}>
          {t.features.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <a href="https://openstage.live/dashboard" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', color: '#000', padding: '16px 32px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', textDecoration: 'none' }}>
          {t.ctaText}
        </a>
      </div>

      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#94a3b8' }}>
        {t.note}
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '24px 0' }} />

      <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#64748b', textAlign: 'center' }}>
        {t.footer}
      </p>
    </BaseEmailLayout>
  );
}