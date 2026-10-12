import * as React from 'react';
import { render } from '@react-email/render';
import { WelcomeEmail } from './templates/welcome';
import { ConfirmEmail } from './templates/confirm-email';
import { EventReceivedEmail } from './templates/event-received';
import { EventHiddenOrRejectedEmail } from './templates/event-hidden-or-rejected';
import { ReminderFirstEventEmail } from './templates/reminder-first-event';
import { EventChangedOrCancelledEmail } from './templates/event-changed-or-cancelled';
import { EventReminderEmail } from './templates/event-reminder';
import { WeeklyDigestEmail } from './templates/weekly-digest';
import { ContactTicketConfirmationEmail } from './templates/contact-ticket-confirmation';
import { ContactReplyEmail } from './templates/contact-reply';
import { ClaimProfileInviteEmail } from './templates/claim-profile-invite';
import { AdminAlertEmail } from './templates/admin-alert';

export type EmailTemplateName =
  | 'welcome'
  | 'confirm_email'
  | 'event_received'
  | 'event_hidden_or_rejected'
  | 'reminder_first_event'
  | 'event_changed_or_cancelled'
  | 'event_reminder'
  | 'weekly_digest'
  | 'contact_ticket_confirmation'
  | 'contact_reply'
  | 'claim_profile_invite'
  | 'admin_alert';

export async function renderEmailTemplate(
  template: EmailTemplateName | string,
  data: any = {},
  locale: 'it' | 'en' = 'it'
): Promise<{ html: string; text?: string }> {
  let element: React.ReactElement;

  switch (template) {
    case 'welcome':
      element = <WelcomeEmail {...data} locale={locale} />;
      break;
    case 'confirm_email':
      element = <ConfirmEmail {...data} locale={locale} />;
      break;
    case 'event_received':
      element = <EventReceivedEmail {...data} locale={locale} />;
      break;
    case 'event_hidden_or_rejected':
      element = <EventHiddenOrRejectedEmail {...data} locale={locale} />;
      break;
    case 'reminder_first_event':
      element = <ReminderFirstEventEmail {...data} locale={locale} />;
      break;
    case 'event_changed_or_cancelled':
      element = <EventChangedOrCancelledEmail {...data} locale={locale} />;
      break;
    case 'event_reminder':
      element = <EventReminderEmail {...data} locale={locale} />;
      break;
    case 'weekly_digest':
      element = <WeeklyDigestEmail {...data} locale={locale} />;
      break;
    case 'contact_ticket_confirmation':
      element = <ContactTicketConfirmationEmail {...data} locale={locale} />;
      break;
    case 'contact_reply':
      element = <ContactReplyEmail {...data} locale={locale} />;
      break;
    case 'claim_profile_invite':
      element = <ClaimProfileInviteEmail {...data} locale={locale} />;
      break;
    case 'admin_alert':
      element = <AdminAlertEmail {...data} locale={locale} />;
      break;
    default:
      throw new Error(`Unknown email template: ${template}`);
  }

  const html = await render(element);
  const text = await render(element, { plainText: true });

  return { html, text };
}
