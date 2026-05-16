'use client';

import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({ variant = 'primary', className, children, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white hover:brightness-110 shadow-lg shadow-purple-900/30',
    secondary:
      'bg-[#1a1a2e] border border-[#2d2d4e] text-[#e2e8f0] hover:border-[#7c3aed]/60 hover:bg-[#2d2d4e]',
    ghost: 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a1a2e]',
    danger: 'bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30',
  };

  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
