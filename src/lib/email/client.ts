import { Resend } from 'resend';

// Resend client instance
const apiKey = process.env.RESEND_API_KEY || 're_placeholder_development_key';

export const resend = new Resend(apiKey);

// Verified custom domain sender (RESEND_FROM env var)
export const SENDER_EMAIL = process.env.RESEND_FROM || 'OpenStage <no-reply@openstage.it>';
