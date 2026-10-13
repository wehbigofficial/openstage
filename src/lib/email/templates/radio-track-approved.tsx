import React from 'react';
import { BaseEmailLayout } from './BaseEmailLayout';

interface RadioTrackApprovedProps {
  artistName: string;
  trackTitle: string;
  locale?: 'it' | 'en';
}

export function RadioTrackApproved({ artistName, trackTitle, locale = 'it' }: RadioTrackApprovedProps) {
  const isIt = locale === 'it';
  
  const t = {
    preheader: isIt ? `Il tuo brano "${trackTitle}" è stato approvato per OpenStage Radio` : `Your track "${trackTitle}" has been approved for OpenStage Radio`,
    title: isIt ? 'Brano Approvato per OpenStage Radio! 🎵' : 'Track Approved for OpenStage Radio! 🎵',
    subtitle: isIt ? 'La tua musica è ora in rotazione live 24/7' : 'Your music is now in 24/7 live rotation',
    greeting: isIt ? `Ciao <strong>${artistName}</strong>,` : `Hi <strong>${artistName}</strong>,`,
    approved: isIt
      ? `Ottime notizie: il tuo brano <strong>"${trackTitle}"</strong> è stato <strong>approvato</strong> dal team di moderazione e ora entra nella rotazione di <strong>OpenStage Radio 24/7</strong>.`
      : `Great news: your track <strong>"${trackTitle}"</strong> has been <strong>approved</strong> by our moderation team and now enters <strong>OpenStage Radio 24/7</strong> rotation.`,
    badgeTitle: isIt ? 'In Onda su OpenStage Radio' : 'On Air on OpenStage Radio',
    whatMeans: isIt ? 'Cosa significa per te:' : 'What this means for you:',
    benefits: isIt ? [
      'Il tuo brano viene trasmesso in sincrono a tutti gli ascoltatori in Italia e non solo',
      'Durante la riproduzione appare il tuo nome con link diretto alla <strong>Bio Page</strong>',
      'Un pulsante <strong>"Prossimo Live"</strong> porta i listener al tuo prossimo concerto',
      'Gli ascoltatori possono mettere <strong>Mi piace</strong> al brano (contatore visibile)',
      'Ogni ascolto oltre 30 secondi conta nelle tue <strong>statistiche Pro</strong>',
    ] : [
      'Your track plays in sync to all listeners across Italy and beyond',
      'During playback your name appears with a direct link to your <strong>Bio Page</strong>',
      'A <strong>"Next Gig"</strong> button takes listeners to your next show',
      'Listeners can <strong>Like</strong> the track (visible counter)',
      'Every play over 30 seconds counts in your <strong>Pro stats</strong>',
    ],
    rememberTitle: isIt ? 'Ricorda:' : 'Remember:',
    remember: isIt ? [
      'Puoi caricare fino a <strong>3 brani totali</strong> (max 10 MB cadauno, MP3)',
      'La rotazione è <strong>equa tra tutti gli artisti</strong> — niente skip, niente previous',
      'Il player è fisso in fondo a ogni pagina, riducibile a pill',
    ] : [
      'You can upload up to <strong>3 total tracks</strong> (max 10 MB each, MP3)',
      'Rotation is <strong>fair across all artists</strong> — no skip, no previous',
      'The player is fixed at the bottom of every page, collapsible to a pill',
    ],
    ctaText: isIt ? 'Gestisci i tuoi brani Radio →' : 'Manage your Radio tracks →',
    footer: isIt
      ? 'OpenStage Radio — Musica indipendente in rotazione continua 24/7<br /><a href="https://openstage.live/contact" style={{ color: \'#8b5cf6\' }}>Contattaci</a> per dubbi.'
      : 'OpenStage Radio — Independent music in continuous 24/7 rotation<br /><a href="https://openstage.live/contact" style={{ color: \'#8b5cf6\' }}>Contact us</a> with any questions.',
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
        {t.approved}
      </p>

      <div style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)', borderRadius: '16px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>📻</div>
        <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '20px' }}>{t.badgeTitle}</h3>
        <p style={{ color: '#fff', margin: 0, fontSize: '16px' }}>"{trackTitle}"</p>
      </div>

      <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '24px' }}>
        {t.whatMeans}
      </p>

      <ul style={{ color: '#e2e8f0', margin: 0, paddingLeft: '20px', lineHeight: '2' }}>
        {t.benefits.map((item, i) => <li key={i}>{item}</li>)}
      </ul>

      <div style={{ background: 'linear-gradient(135deg, #1e1b2e 0%, #0f0f1a 100%)', border: '1px solid #06b6d4', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ color: '#06b6d4', margin: '0 0 12px', fontSize: '16px' }}>{t.rememberTitle}</h4>
        <ul style={{ color: '#94a3b8', margin: 0, paddingLeft: '20px', lineHeight: '1.8', fontSize: '14px' }}>
          {t.remember.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <a href="https://openstage.live/dashboard" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)', color: '#fff', padding: '16px 32px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', textDecoration: 'none' }}>
          {t.ctaText}
        </a>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '24px 0' }} />

      <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#64748b', textAlign: 'center' }}>
        {t.footer}
      </p>
    </BaseEmailLayout>
  );
}