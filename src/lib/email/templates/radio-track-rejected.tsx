import React from 'react';
import { BaseEmailLayout } from './BaseEmailLayout';

interface RadioTrackRejectedProps {
  artistName: string;
  trackTitle: string;
  reason: string;
  locale?: 'it' | 'en';
}

export function RadioTrackRejected({ artistName, trackTitle, reason, locale = 'it' }: RadioTrackRejectedProps) {
  const isIt = locale === 'it';
  
  const t = {
    preheader: isIt ? `Aggiornamento sul tuo brano "${trackTitle}" per OpenStage Radio` : `Update on your track "${trackTitle}" for OpenStage Radio`,
    title: isIt ? 'Aggiornamento sul tuo brano per la Radio' : 'Update on your Radio Track',
    subtitle: isIt ? 'Il team di moderazione ha esaminato la tua traccia' : 'The moderation team has reviewed your track',
    greeting: isIt ? `Ciao <strong>${artistName}</strong>,` : `Hi <strong>${artistName}</strong>,`,
    rejected: isIt
      ? `Grazie per aver caricato <strong>"${trackTitle}"</strong> per OpenStage Radio. Il nostro team ha esaminato la traccia e, purtroppo, <strong>non è stata approvata</strong> per la rotazione.`
      : `Thanks for uploading <strong>"${trackTitle}"</strong> for OpenStage Radio. Our team has reviewed the track and, unfortunately, <strong>it was not approved</strong> for rotation.`,
    reasonTitle: isIt ? 'Motivo del rifiuto:' : 'Rejection Reason:',
    commonReasonsTitle: isIt ? 'Motivi comuni di rifiuto includono:' : 'Common rejection reasons include:',
    commonReasons: isIt ? [
      'Qualità audio insufficiente (bitrate troppo basso, distorsione, volume non normalizzato)',
      'Contenuto non musicale (spoken word, rumore, test non musicali)',
      'Possibile violazione diritti d\'autore (cover non dichiarate, sample non autorizzati)',
      'File corrotto o formato non supportato (solo MP3, max 10 MB)',
      'Metadati mancanti o non corrispondenti',
    ] : [
      'Insufficient audio quality (bitrate too low, distortion, unnormalized volume)',
      'Non-musical content (spoken word, noise, non-musical tests)',
      'Possible copyright violation (undeclared covers, unauthorized samples)',
      'Corrupted file or unsupported format (MP3 only, max 10 MB)',
      'Missing or mismatched metadata',
    ],
    retry: isIt
      ? '<strong>Puoi riprovare:</strong> correggi il problema indicato e carica nuovamente il brano dalla tua Dashboard. Hai a disposizione fino a 3 slot totali per la Radio.'
      : '<strong>You can retry:</strong> fix the indicated issue and re-upload the track from your Dashboard. You have up to 3 total slots for Radio.',
    ctaText: isIt ? 'Carica una nuova versione →' : 'Upload a new version →',
    requirementsTitle: isIt ? 'Requisiti per l\'approvazione:' : 'Requirements for approval:',
    requirements: isIt ? [
      'File MP3, max 10 MB, bitrate consigliato ≥ 192 kbps',
      'Audio pulito, masterizzato, volume normalizzato (-14 LUFS target streaming)',
      'Dichiari di possedere <strong>tutti i diritti</strong> (composizione + registrazione)',
      'Nessun contenuto offensivo, violenza, hate speech',
      'Titolo corretto, niente caratteri speciali eccessivi',
    ] : [
      'MP3 file, max 10 MB, recommended bitrate ≥ 192 kbps',
      'Clean, mastered audio, normalized volume (-14 LUFS streaming target)',
      'You declare ownership of <strong>all rights</strong> (composition + recording)',
      'No offensive content, violence, hate speech',
      'Correct title, no excessive special characters',
    ],
    footer: isIt
      ? 'Se ritieni ci sia stato un errore, <a href="https://openstage.live/contact" style={{ color: \'#8b5cf6\' }}>apri un ticket</a> indicando l\'ID del brano.<br />OpenStage Radio — Musica indipendente, moderata con cura.'
      : 'If you believe there was an error, <a href="https://openstage.live/contact" style={{ color: \'#8b5cf6\' }}>open a ticket</a> with the track ID.<br />OpenStage Radio — Independent music, carefully moderated.',
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
        {t.rejected}
      </p>

      <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <h4 style={{ color: '#dc2626', margin: '0 0 12px', fontSize: '16px' }}>{t.reasonTitle}</h4>
        <p style={{ color: '#991b1b', margin: 0, fontSize: '15px', lineHeight: '1.6', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
          {reason}
        </p>
      </div>

      <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '24px' }}>
        {t.commonReasonsTitle}
      </p>

      <ul style={{ color: '#e2e8f0', margin: 0, paddingLeft: '20px', lineHeight: '2' }}>
        {t.commonReasons.map((item, i) => <li key={i}>{item}</li>)}
      </ul>

      <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '24px' }}>
        {t.retry}
      </p>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <a href="https://openstage.live/dashboard" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', color: '#fff', padding: '16px 32px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', textDecoration: 'none' }}>
          {t.ctaText}
        </a>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #1e1b2e 0%, #0f0f1a 100%)', border: '1px solid #8b5cf6', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ color: '#8b5cf6', margin: '0 0 12px', fontSize: '16px' }}>{t.requirementsTitle}</h4>
        <ul style={{ color: '#94a3b8', margin: 0, paddingLeft: '20px', lineHeight: '1.8', fontSize: '14px' }}>
          {t.requirements.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '24px 0' }} />

      <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#64748b', textAlign: 'center' }}>
        {t.footer}
      </p>
    </BaseEmailLayout>
  );
}