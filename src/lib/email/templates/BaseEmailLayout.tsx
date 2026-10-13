import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';

interface BaseEmailLayoutProps {
  previewText: string;
  preheader?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
  locale?: 'it' | 'en';
}

export function BaseEmailLayout({
  previewText,
  preheader,
  title,
  subtitle,
  children,
  showUnsubscribe = true,
  unsubscribeUrl = 'https://openstage.it/unsubscribe',
  preferencesUrl = 'https://openstage.it/settings',
  locale = 'it',
}: BaseEmailLayoutProps) {
  const isIt = locale === 'it';

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preheader || previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header with OpenStage Brand */}
          <Section style={headerSection}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
              <tr>
                <td>
                  <span style={brandLogoText}>OpenStage</span>
                </td>
                <td align="right">
                  <span style={taglineText}>
                    {isIt ? 'Musica dal vivo indipendente' : 'Live indie music'}
                  </span>
                </td>
              </tr>
            </table>
          </Section>

          {/* Card Content */}
          <Section style={cardSection}>
            {title && (
              <Text style={titleStyle}>{title}</Text>
            )}
            {subtitle && (
              <Text style={subtitleStyle}>{subtitle}</Text>
            )}
            {children}
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Hr style={hrStyle} />
            <Text style={doNotReplyText}>
              {isIt
                ? 'Non puoi rispondere a questa email. Per contattarci, apri un nuovo ticket nella pagina Contatti.'
                : 'You cannot reply to this email. To contact us, open a new ticket on the Contact page.'}
            </Text>

            <Text style={footerLinksText}>
              <Link href="https://openstage.it/contact" style={footerLink}>
                {isIt ? 'Contattaci' : 'Contact us'}
              </Link>
              {' • '}
              <Link href={preferencesUrl} style={footerLink}>
                {isIt ? 'Preferenze' : 'Preferences'}
              </Link>
              {showUnsubscribe && (
                <>
                  {' • '}
                  <Link href={unsubscribeUrl} style={footerLink}>
                    {isIt ? 'Disiscriviti' : 'Unsubscribe'}
                  </Link>
                </>
              )}
            </Text>

            <Text style={copyrightText}>
              © 2026 OpenStage • Italia • Europe/Rome
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styling (Dark brand theme: #07070D background, #0F0F1A card, violet & cyan accents)
const mainStyle: React.CSSProperties = {
  backgroundColor: '#07070D',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: '40px 0',
  color: '#F1F5F9',
};

const containerStyle: React.CSSProperties = {
  margin: '0 auto',
  maxWidth: '560px',
  padding: '0 20px',
};

const headerSection: React.CSSProperties = {
  paddingBottom: '24px',
};

const brandLogoText: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '800',
  color: '#FFFFFF',
  letterSpacing: '-0.5px',
};

const taglineText: React.CSSProperties = {
  fontSize: '11px',
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontWeight: 600,
};

const cardSection: React.CSSProperties = {
  backgroundColor: '#0F0F1A',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '32px',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '800',
  color: '#FFFFFF',
  marginBottom: '8px',
  lineHeight: '1.3',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#94A3B8',
  marginBottom: '24px',
  lineHeight: '1.5',
};

export const mainButtonStyle: React.CSSProperties = {
  backgroundColor: '#7C3AED',
  backgroundImage: 'linear-gradient(to right, #7C3AED, #06B6D4)',
  borderRadius: '12px',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '14px 28px',
  margin: '20px 0',
};

const footerSection: React.CSSProperties = {
  paddingTop: '20px',
  textAlign: 'center',
};

const hrStyle: React.CSSProperties = {
  borderColor: 'rgba(255, 255, 255, 0.1)',
  margin: '20px 0',
};

const doNotReplyText: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#94A3B8',
  margin: '8px 0',
};

const footerLinksText: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748B',
  margin: '8px 0',
};

const footerLink: React.CSSProperties = {
  color: '#38BDF8',
  textDecoration: 'none',
};

const copyrightText: React.CSSProperties = {
  fontSize: '11px',
  color: '#475569',
  marginTop: '12px',
};
