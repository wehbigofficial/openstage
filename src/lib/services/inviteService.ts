import { createAdminClient } from '@/lib/supabase/admin';
import { enqueueEmail } from '@/lib/email/queue';

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'OS-';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/**
 * Get or create unique personal invite code for artist
 */
export async function getOrCreateArtistInviteCode(profileId: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: artist } = await supabase
    .from('artists')
    .select('invite_code')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (artist?.invite_code) {
    return artist.invite_code;
  }

  // Generate code and ensure uniqueness
  let code = generateRandomCode();
  let tries = 0;
  while (tries < 5) {
    const { data: existing } = await supabase
      .from('artists')
      .select('profile_id')
      .eq('invite_code', code)
      .maybeSingle();

    if (!existing) break;
    code = generateRandomCode();
    tries++;
  }

  await supabase
    .from('artists')
    .update({ invite_code: code })
    .eq('profile_id', profileId);

  return code;
}

/**
 * Record a referral when invited artist registers
 */
export async function recordArtistReferral({
  inviteCode,
  invitedUserId,
}: {
  inviteCode: string;
  invitedUserId: string;
}) {
  const supabase = createAdminClient();

  // Find referrer
  const { data: referrer } = await supabase
    .from('artists')
    .select('profile_id')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .maybeSingle();

  if (!referrer || referrer.profile_id === invitedUserId) {
    return null;
  }

  // Check email confirmed on auth user
  let isEmailVerified = false;
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(invitedUserId);
    if (authUser?.user?.email_confirmed_at) {
      isEmailVerified = true;
    }
  } catch {}

  // Check if invited user already published a non-flagged event
  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', invitedUserId)
    .eq('status', 'published');

  const hasPublishedEvent = Boolean(eventCount && eventCount > 0);
  const isQualified = isEmailVerified && hasPublishedEvent;

  const { data: referral, error } = await supabase
    .from('artist_referrals')
    .upsert(
      {
        referrer_id: referrer.profile_id,
        invited_id: invitedUserId,
        invite_code: inviteCode.trim().toUpperCase(),
        is_email_verified: isEmailVerified,
        has_published_event: hasPublishedEvent,
        is_qualified: isQualified,
        qualified_at: isQualified ? new Date().toISOString() : null,
      },
      { onConflict: 'invited_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error inserting artist referral:', error);
    return null;
  }

  if (isQualified) {
    await checkAndRewardReferrer(referrer.profile_id);
  }

  return referral;
}

/**
 * Called when an event is published by an artist - checks if they were invited and qualify
 */
export async function checkReferralOnEventPublished(invitedUserId: string) {
  const supabase = createAdminClient();

  const { data: referral } = await supabase
    .from('artist_referrals')
    .select('*')
    .eq('invited_id', invitedUserId)
    .maybeSingle();

  if (!referral) return;

  let isEmailVerified = referral.is_email_verified;
  if (!isEmailVerified) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(invitedUserId);
      if (authUser?.user?.email_confirmed_at) {
        isEmailVerified = true;
      }
    } catch {}
  }

  const isQualified = isEmailVerified; // Has now published an event!

  await supabase
    .from('artist_referrals')
    .update({
      has_published_event: true,
      is_email_verified: isEmailVerified,
      is_qualified: isQualified,
      qualified_at: isQualified ? new Date().toISOString() : null,
    })
    .eq('id', referral.id);

  if (isQualified) {
    await checkAndRewardReferrer(referral.referrer_id);
  }
}

/**
 * Check if referrer has reached 3 qualified referrals, and award Pro for free!
 */
export async function checkAndRewardReferrer(referrerId: string) {
  const supabase = createAdminClient();

  // Count valid, non-revoked qualified referrals
  const { count } = await supabase
    .from('artist_referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('is_qualified', true)
    .eq('is_revoked', false);

  const qualifiedCount = count || 0;

  if (qualifiedCount >= 3) {
    // Check if artist is already Pro
    const { data: artist } = await supabase
      .from('artists')
      .select('is_pro, pro_granted_by')
      .eq('profile_id', referrerId)
      .maybeSingle();

    if (!artist?.is_pro) {
      // Grant Artist Pro for free!
      await supabase
        .from('artists')
        .update({
          is_pro: true,
          pro_since: new Date().toISOString(),
          pro_granted_by: 'referral',
          featured_eligible: true,
        })
        .eq('profile_id', referrerId);

      // Get profile for notification & email
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, preferred_language')
        .eq('id', referrerId)
        .maybeSingle();

      const artistName = profile?.display_name || 'Artista';
      const locale = (profile?.preferred_language as 'it' | 'en') || 'it';

      // Log in admin notifications
      await supabase.from('admin_notifications').insert({
        type: 'pro_purchase',
        title: 'Artist Pro sbloccato tramite Inviti (Gratuito)',
        message: `L'artista ${artistName} ha raggiunto 3 colleghi qualificati e ha ottenuto Artist Pro gratis.`,
        link: '/admin?tab=referrals',
      });

      // Send reward email to artist
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(referrerId);
        const email = authUser?.user?.email;
        if (email) {
          await enqueueEmail({
            userId: referrerId,
            toEmail: email,
            template: 'referral_reward_unlocked',
            category: 'transactional',
            subject:
              locale === 'en'
                ? 'Congratulations! You unlocked Artist Pro for free!'
                : 'Complimenti! Hai sbloccato Artist Pro gratis per sempre!',
            data: {
              artistName,
            },
            locale,
            idempotencyKey: `ref_reward_${referrerId}`,
          });
        }
      } catch (err) {
        console.error('Error sending referral reward email:', err);
      }
    }
  }
}

/**
 * Get referral stats for an artist dashboard
 */
export async function getArtistReferralStats(artistId: string) {
  const supabase = createAdminClient();
  const inviteCode = await getOrCreateArtistInviteCode(artistId);

  const { data: referrals, error } = await supabase
    .from('artist_referrals')
    .select('*')
    .eq('referrer_id', artistId)
    .order('created_at', { ascending: false });

  if (error || !referrals) {
    return {
      inviteCode,
      inviteUrl: `/invite/${inviteCode}`,
      totalInvited: 0,
      verifiedCount: 0,
      qualifiedCount: 0,
      neededCount: 3,
      isRewarded: false,
      referrals: [],
    };
  }

  const totalInvited = referrals.length;
  const verifiedCount = referrals.filter((r) => r.is_email_verified).length;
  const qualifiedCount = referrals.filter((r) => r.is_qualified && !r.is_revoked).length;

  const { data: artist } = await supabase
    .from('artists')
    .select('is_pro, pro_granted_by')
    .eq('profile_id', artistId)
    .maybeSingle();

  const isRewarded = Boolean(artist?.is_pro && (artist?.pro_granted_by === 'referral' || qualifiedCount >= 3));

  return {
    inviteCode,
    inviteUrl: `/invite/${inviteCode}`,
    totalInvited,
    verifiedCount,
    qualifiedCount,
    neededCount: 3,
    isRewarded,
    referrals,
  };
}

/**
 * Get all referrals aggregated for admin panel
 */
export async function getAllReferralsForAdmin() {
  const supabase = createAdminClient();

  const { data: referrals, error } = await supabase
    .from('artist_referrals')
    .select(`
      *,
      referrer:referrer_id (
        id,
        display_name
      ),
      invited:invited_id (
        id,
        display_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error || !referrals) return [];

  // Group by referrer
  const map = new Map<string, any>();

  for (const r of referrals) {
    const refId = r.referrer_id;
    if (!map.has(refId)) {
      map.set(refId, {
        referrerId: refId,
        referrerName: r.referrer?.display_name || 'Artista ' + refId.substring(0, 6),
        inviteCode: r.invite_code,
        invitedCount: 0,
        verifiedCount: 0,
        qualifiedCount: 0,
        isRewarded: false,
        referrals: [],
      });
    }

    const item = map.get(refId);
    item.invitedCount += 1;
    if (r.is_email_verified) item.verifiedCount += 1;
    if (r.is_qualified && !r.is_revoked) item.qualifiedCount += 1;
    item.referrals.push(r);
  }

  // Check Pro status for each referrer
  const list = Array.from(map.values());
  for (const item of list) {
    const { data: artist } = await supabase
      .from('artists')
      .select('is_pro, pro_granted_by')
      .eq('profile_id', item.referrerId)
      .maybeSingle();

    item.isRewarded = Boolean(artist?.is_pro && artist?.pro_granted_by === 'referral');
  }

  return list;
}

/**
 * Admin action: revoke referral abuse
 */
export async function revokeReferralAbuse(referralId: string, reason: string) {
  const supabase = createAdminClient();

  const { data: ref, error } = await supabase
    .from('artist_referrals')
    .update({
      is_revoked: true,
      revocation_reason: reason,
    })
    .eq('id', referralId)
    .select()
    .single();

  if (error) throw error;

  // Re-check referrer qualified count
  const { count } = await supabase
    .from('artist_referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', ref.referrer_id)
    .eq('is_qualified', true)
    .eq('is_revoked', false);

  const validCount = count || 0;

  // If referrer was granted Pro via referral and now has less than 3, revoke Pro
  const { data: artist } = await supabase
    .from('artists')
    .select('is_pro, pro_granted_by')
    .eq('profile_id', ref.referrer_id)
    .maybeSingle();

  if (artist?.pro_granted_by === 'referral' && validCount < 3) {
    await supabase
      .from('artists')
      .update({
        is_pro: false,
        featured_eligible: false,
      })
      .eq('profile_id', ref.referrer_id);
  }

  return { success: true, validCount };
}
