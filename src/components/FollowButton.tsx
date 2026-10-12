'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { QuickAuthModal } from '@/components/QuickAuthModal';
import { Heart, Check } from 'lucide-react';

interface FollowButtonProps {
  targetId: string;
  targetType: 'artist' | 'venue';
  targetName: string;
  className?: string;
}

export function FollowButton({
  targetId,
  targetType,
  targetName,
  className = '',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function checkFollow() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('fan_follows')
          .select('id')
          .eq('user_id', user.id)
          .eq('target_id', targetId)
          .maybeSingle();

        if (data) {
          setIsFollowing(true);
        }
      }
    }
    checkFollow();
  }, [targetId]);

  const handleToggleFollow = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setLoading(true);
      const nextFollow = !isFollowing;
      setIsFollowing(nextFollow);

      await fetch('/api/fan/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: targetId,
          target_type: targetType,
          target_name: targetName,
        }),
      });
    } catch {
      setIsFollowing(!isFollowing);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleToggleFollow}
        disabled={loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
          isFollowing
            ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30 hover:bg-rose-600/30'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15 shadow-sm'
        } ${className}`}
      >
        <Heart className={`w-3.5 h-3.5 ${isFollowing ? 'fill-pink-400 text-pink-400' : 'text-slate-300'}`} />
        <span>{isFollowing ? 'Seguito' : 'Segui'}</span>
      </button>

      <QuickAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={`Accedi per seguire ${targetName}`}
        subtitle="Ricevi aggiornamenti sui nuovi concerti e date annunciate nel tuo digest settimanale."
      />
    </>
  );
}
