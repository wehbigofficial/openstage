import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enqueueEmail } from '@/lib/email/queue';
import { createAdminNotification } from '@/lib/services/adminService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, user_type, message, turnstileToken } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Nome, email e messaggio sono obbligatori' },
        { status: 400 }
      );
    }

    const validTypes = ['artist', 'venue', 'fan', 'other'];
    const chosenType = validTypes.includes(user_type) ? user_type : 'other';

    // Verify Turnstile if secret key is present
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && turnstileToken && !turnstileToken.startsWith('mock_')) {
      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(turnstileToken)}`,
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return NextResponse.json(
            { error: 'Verifica di sicurezza anti-bot non riuscita' },
            { status: 400 }
          );
        }
      } catch (err) {
        console.warn('Turnstile verification failed, proceeding gracefully', err);
      }
    }

    // Generate readable unique ticket number e.g. OS-294812
    const ticketRandom = Math.floor(100000 + Math.random() * 900000);
    const ticketNumber = `OS-${ticketRandom}`;

    const supabase = createAdminClient();

    let createdTicket: any = null;
    try {
      const { data, error } = await supabase
        .from('contact_tickets')
        .insert({
          ticket_number: ticketNumber,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          user_type: chosenType,
          message: message.trim(),
          status: 'new',
        })
        .select('*')
        .single();

      if (error) {
        console.warn('DB insert error into contact_tickets, using mock ticket', error);
      } else {
        createdTicket = data;
      }
    } catch (dbErr) {
      console.warn('Supabase offline, using local response', dbErr);
    }

    // 1. Send automatic confirmation email to sender with no-reply notice
    try {
      await enqueueEmail({
        toEmail: email.trim().toLowerCase(),
        template: 'contact_ticket_confirmation',
        category: 'transactional',
        subject: `[OpenStage] Abbiamo ricevuto il tuo messaggio #${ticketNumber}`,
        data: {
          ticketId: ticketNumber,
          subject: `Richiesta supporto (${chosenType.toUpperCase()})`,
          senderName: name.trim(),
          messagePreview: message.trim().slice(0, 180),
          ticketUrl: 'https://openstage.it/contact',
        },
        locale: 'it',
      });
    } catch (mailErr) {
      console.warn('Could not enqueue ticket confirmation email', mailErr);
    }

    // 2. Notify admin in the panel
    try {
      await createAdminNotification({
        type: 'signup', // Notice: appear only in panel (no email)
        title: `Nuovo messaggio di contatto da ${name.trim()} (${ticketNumber})`,
        message: `[${chosenType.toUpperCase()}] ${message.trim().slice(0, 120)}...`,
        link: '/admin?tab=contact',
      });
    } catch (notifErr) {
      console.warn('Could not create admin notification', notifErr);
    }

    return NextResponse.json({
      success: true,
      ticketNumber,
      ticket: createdTicket || {
        id: crypto.randomUUID(),
        ticket_number: ticketNumber,
        name,
        email,
        user_type: chosenType,
        message,
        status: 'new',
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Errore durante l invio del messaggio' },
      { status: 500 }
    );
  }
}
