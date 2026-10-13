import React from 'react';
import { BaseEmailLayout } from './BaseEmailLayout';

interface ArtistProReceiptProps {
  artistName: string;
  amount: string;
  transactionId: string;
  date: string;
  locale?: 'it' | 'en';
}

export function ArtistProReceipt({ artistName, amount, transactionId, date, locale = 'it' }: ArtistProReceiptProps) {
  const isIt = locale === 'it';
  
  const t = {
    preheader: isIt ? 'La tua ricevuta per l\'acquisto Artist Pro su OpenStage' : 'Your receipt for Artist Pro purchase on OpenStage',
    title: isIt ? 'Artist Pro Attivato!' : 'Artist Pro Activated!',
    subtitle: isIt ? 'Grazie per il tuo supporto alla musica indipendente' : 'Thank you for supporting independent music',
    greeting: isIt ? `Ciao <strong>${artistName}</strong>,` : `Hi <strong>${artistName}</strong>,`,
    paymentSuccess: isIt 
      ? 'Il tuo pagamento è stato elaborato con successo e <strong>Artist Pro è ora attivo</strong> sul tuo account OpenStage.'
      : 'Your payment has been processed successfully and <strong>Artist Pro is now active</strong> on your OpenStage account.',
    receiptDetails: {
      amount: isIt ? 'Importo' : 'Amount',
      transaction: isIt ? 'Transazione' : 'Transaction',
      date: isIt ? 'Data' : 'Date',
      method: isIt ? 'Metodo' : 'Method',
    },
    unlockedTitle: isIt ? 'Cosa hai sbloccato ora' : 'What you\'ve unlocked now',
    unlockedItems: isIt ? [
      'Bio page ufficiale con copertina, galleria, video e player brani',
      'Rotazione su OpenStage Radio 24/7 (fino a 3 MP3)',
      'Statistiche avanzate: andamento temporale, città dei fan, ascolti radio',
      'Share card senza watermark OpenStage',
      'Idoneità prioritaria per slot In Evidenza',
    ] : [
      'Official bio page with cover, gallery, videos and track player',
      'Rotation on OpenStage Radio 24/7 (up to 3 MP3 tracks)',
      'Advanced stats: timeline trends, fan cities, radio plays',
      'Share cards without OpenStage watermark',
      'Priority eligibility for Featured slots',
    ],
    dashboardLink: isIt 
      ? 'Vai alla tua <a href="https://openstage.live/dashboard" style={{ color: \'#8b5cf6\', textDecoration: \'none\' }}>Dashboard</a> per iniziare a usare le funzionalità Pro.'
      : 'Go to your <a href="https://openstage.live/dashboard" style={{ color: \'#8b5cf6\', textDecoration: \'none\' }}>Dashboard</a> to start using Pro features.',
    footer: isIt
      ? 'Questa è una ricevuta automatica. Conservala per i tuoi archivi.<br />Per assistenza: <a href="https://openstage.live/contact" style={{ color: \'#8b5cf6\' }}>apri un ticket</a>.'
      : 'This is an automated receipt. Keep it for your records.<br />For support: <a href="https://openstage.live/contact" style={{ color: \'#8b5cf6\' }}>open a ticket</a>.',
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
        {t.paymentSuccess}
      </p>

      <div style={{ background: 'linear-gradient(135deg, #1e1b2e 0%, #0f0f1a 100%)', border: '1px solid #8b5cf6', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tr>
            <td style={{ padding: '8px 0', color: '#94a3b8', fontSize: '14px' }}>{t.receiptDetails.amount}</td>
            <td style={{ padding: '8px 0', color: '#f8fafc', fontSize: '16px', fontWeight: 'bold', textAlign: 'right' }}>{amount}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', color: '#94a3b8', fontSize: '14px' }}>{t.receiptDetails.transaction}</td>
            <td style={{ padding: '8px 0', color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace', textAlign: 'right' }}>{transactionId}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', color: '#94a3b8', fontSize: '14px' }}>{t.receiptDetails.date}</td>
            <td style={{ padding: '8px 0', color: '#94a3b8', fontSize: '14px', textAlign: 'right' }}>{date}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', color: '#94a3b8', fontSize: '14px' }}>{t.receiptDetails.method}</td>
            <td style={{ padding: '8px 0', color: '#94a3b8', fontSize: '14px', textAlign: 'right' }}>PayPal</td>
          </tr>
        </table>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
        <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '18px' }}>{t.unlockedTitle}</h3>
        <ul style={{ color: '#fff', margin: 0, paddingLeft: '20px', textAlign: 'left', lineHeight: '2' }}>
          {t.unlockedItems.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>

      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#94a3b8', textAlign: 'center' }}>
        {t.dashboardLink}
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '24px 0' }} />

      <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#64748b', textAlign: 'center' }}>
        {t.footer}
      </p>
    </BaseEmailLayout>
  );
}