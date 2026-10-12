# Configurazione Resend SMTP con Supabase Auth (Fase 4)

Per inoltrare tutte le email di autenticazione Supabase (conferma registrazione, reimpostazione password, invito utente) attraverso Resend e il dominio personalizzato verificato, configurare i seguenti parametri nel dashboard di Supabase:

## Parametri SMTP Supabase
Naviga su: **Supabase Dashboard -> Project Settings -> Authentication -> SMTP Settings**

- **Enable Custom SMTP**: `true` (ON)
- **Sender email**: `no-reply@openstage.it` (deve corrispondere alla variabile `RESEND_FROM`)
- **Sender name**: `OpenStage`
- **Host**: `smtp.resend.com`
- **Port**: `465` (SSL) oppure `587` (TLS)
- **Minimum interval between emails**: `60` secondi (per prevenire rate-limiting)
- **User**: `resend`
- **Password**: `<YOUR_RESEND_API_KEY>` (la chiave API Resend `re_...`)

## Variabili d'ambiente richieste (.env.local)
```bash
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM="OpenStage <no-reply@openstage.it>"
CRON_SECRET=your_cron_worker_secret
```

## Funzionalità email implementate
- **Queue**: Tabella `email_queue` con deduplicazione `idempotency_key` e code batch.
- **Log**: Tabella `email_log` con storico invii, tentativi e stato Resend.
- **Rate limiting**: Worker configurato a 2 richieste/sec, batch fino a 100 email per chiamata.
- **Retry con Exponential Backoff**: Fino a 3 tentativi automatici con classificazione errori.
- **Webhooks Resend**: Gestione `email.delivered`, `email.bounced` e `email.complained`.
- **Suppression list**: Tabella `email_suppressions` per escludere indirizzi rimbalzati o con reclamo di spam.
- **Frequency Cap**: Massimo 1 email digest o marketing a settimana per utente.
- **Modelli React Email**: 10 template dark brand responsive con testo do-not-reply e link di disiscrizione.
