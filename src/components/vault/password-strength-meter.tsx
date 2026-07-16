'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface StrengthLevel {
  label: string;
  color: string;
  bgColor: string;
  width: string;
  score: number;
}

function calculateStrength(password: string): StrengthLevel {
  if (!password) {
    return { label: '', color: '', bgColor: '', width: '0%', score: 0 };
  }

  let score = 0;
  const len = password.length;

  // Length scoring
  if (len >= 8) score += 1;
  if (len >= 12) score += 1;
  if (len >= 16) score += 1;
  if (len >= 24) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Patterns (penalize)
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated chars
  if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) score -= 1;

  score = Math.max(0, Math.min(8, score));

  if (score <= 2) {
    return { label: 'Weak', color: 'text-red-400', bgColor: 'bg-red-500', width: '25%', score };
  } else if (score <= 4) {
    return { label: 'Fair', color: 'text-amber-400', bgColor: 'bg-amber-500', width: '50%', score };
  } else if (score <= 6) {
    return { label: 'Good', color: 'text-emerald-400', bgColor: 'bg-emerald-500', width: '75%', score };
  } else {
    return { label: 'Strong', color: 'text-emerald-300', bgColor: 'bg-emerald-400', width: '100%', score };
  }
}

const requirements = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Numbers', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Symbols', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              strength.bgColor
            )}
            style={{ width: strength.width }}
          />
        </div>
        <span className={cn('text-xs font-medium min-w-[52px] text-right', strength.color)}>
          {strength.label}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <div key={req.label} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors duration-300',
                  met ? 'bg-emerald-400' : 'bg-muted-foreground/30'
                )}
              />
              <span
                className={cn(
                  'text-[11px] transition-colors duration-300',
                  met ? 'text-emerald-400/80' : 'text-muted-foreground/50'
                )}
              >
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}