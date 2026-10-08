'use client';

import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onSuccess, onError, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY;

  useEffect(() => {
    // If no sitekey is provided in local development, provide a mock pass-through
    if (!siteKey || siteKey.includes('placeholder')) {
      onSuccess('mock-turnstile-token');
      return;
    }

    const scriptId = 'turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const interval = setInterval(() => {
      if ((window as any).turnstile && containerRef.current) {
        clearInterval(interval);
        try {
          (window as any).turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: onSuccess,
            'error-callback': onError,
            'expired-callback': onExpire,
            theme: 'dark',
          });
        } catch (e) {
          console.error('Turnstile render error', e);
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [siteKey, onSuccess, onError, onExpire]);

  return <div ref={containerRef} className="my-2 min-h-[65px] flex items-center justify-center" />;
}
