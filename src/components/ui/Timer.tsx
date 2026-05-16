'use client';

import { useEffect, useState } from 'react';
import { secondsUntil } from '@/lib/utils';

interface TimerProps {
  endsAt: string | null;
  totalSeconds: number;
  onExpire?: () => void;
  className?: string;
}

export function Timer({ endsAt, totalSeconds, onExpire, className = '' }: TimerProps) {
  const [seconds, setSeconds] = useState(() => secondsUntil(endsAt));

  useEffect(() => {
    setSeconds(secondsUntil(endsAt));

    const interval = setInterval(() => {
      const remaining = secondsUntil(endsAt);
      setSeconds(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
  const isUrgent = seconds <= 10;

  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg width="72" height="72" className="rotate-[-90deg]">
        <circle
          cx="36"
          cy="36"
          r="28"
          fill="none"
          stroke="#2d2d4e"
          strokeWidth="4"
        />
        <circle
          cx="36"
          cy="36"
          r="28"
          fill="none"
          stroke={isUrgent ? '#ef4444' : '#7c3aed'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-xl font-black tabular-nums ${
            isUrgent ? 'text-red-400' : 'text-[#e2e8f0]'
          }`}
        >
          {seconds}
        </span>
      </div>
    </div>
  );
}
