'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as OTPAuth from 'otpauth';
import { Button } from '@/components/ui/button';
import { Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TOTPDisplayProps {
  secret: string;
  label?: string;
  issuer?: string;
}

export function TOTPDisplay({ secret, label, issuer }: TOTPDisplayProps) {
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(30);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateCode = useCallback(() => {
    try {
      // Clean the secret (remove spaces, uppercase)
      const cleanSecret = secret.replace(/\s/g, '').toUpperCase();

      const totp = new OTPAuth.TOTP({
        issuer: issuer || 'Password Vault',
        label: label || 'Account',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(cleanSecret),
      });

      const generated = totp.generate();
      setCode(generated);
      setError(null);
      return generated;
    } catch {
      setError('Invalid TOTP secret');
      setCode('');
      return '';
    }
  }, [secret, label, issuer]);

  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const periodRemaining = 30 - (now % 30);
      setRemaining(periodRemaining);

      // Generate new code at the start of each period
      if (periodRemaining === 30 || !code) {
        generateCode();
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generateCode, code]);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('TOTP code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
        <ShieldCheck className="h-4 w-4 text-red-400 shrink-0" />
        <span className="text-xs text-red-400">{error}</span>
      </div>
    );
  }

  // Progress percentage for the circular indicator
  const progress = (remaining / 30) * 100;
  // Color shifts from emerald to amber as time runs out
  const isLow = remaining <= 5;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4" />
        2FA / TOTP Code
      </label>
      <div className="flex items-center gap-3">
        {/* TOTP Code Display */}
        <div className={cn(
          "flex-1 flex items-center gap-2 rounded-xl border px-4 py-3 transition-all",
          isLow
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-primary/20 bg-primary/5"
        )}>
          {/* Circular countdown */}
          <div className="relative h-10 w-10 shrink-0">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-muted/30"
              />
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${progress * 0.975} 97.5`}
                className={cn(
                  "transition-all duration-1000 ease-linear",
                  isLow ? "text-amber-400" : "text-primary"
                )}
                style={{ stroke: 'currentColor' }}
              />
            </svg>
            <span className={cn(
              "absolute inset-0 flex items-center justify-center text-[11px] font-mono font-bold tabular-nums",
              isLow ? "text-amber-400" : "text-foreground"
            )}>
              {remaining}
            </span>
          </div>

          {/* Code digits */}
          <div className="flex-1">
            <code className={cn(
              "text-2xl font-mono font-bold tracking-[0.2em] transition-colors",
              isLow ? "text-amber-400" : "text-foreground"
            )}>
              {code ? code.split('').map((char, i) => (
                <span key={i} className="inline-block">{char}</span>
              )).reduce((acc: React.ReactNode[], char, i) => {
                if (i > 0 && i % 3 === 0) acc.push(<span key={`gap-${i}`} className="w-2" />);
                acc.push(char);
                return acc;
              }, []) : '------'}
            </code>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Refreshes in {remaining}s</p>
          </div>
        </div>

        {/* Copy button */}
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={copyCode}
          title="Copy TOTP code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Raw secret (collapsible) */}
      <details className="group">
        <summary className="text-[11px] text-muted-foreground/50 cursor-pointer hover:text-muted-foreground transition-colors flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          View raw TOTP secret
        </summary>
        <div className="flex items-center gap-2 mt-2">
          <code className="flex-1 rounded-lg bg-muted/40 px-3 py-2 font-mono text-xs break-all tracking-wide">
            {secret}
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(secret);
                toast.success('Secret copied');
              } catch {
                toast.error('Failed to copy');
              }
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </details>
    </div>
  );
}