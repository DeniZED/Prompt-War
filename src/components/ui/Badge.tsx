import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'purple' | 'cyan' | 'green' | 'gold' | 'gray';
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'purple', className, children, ...props }: BadgeProps) {
  const variants = {
    purple: 'bg-[#7c3aed]/20 text-[#7c3aed] border-[#7c3aed]/30',
    cyan: 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/30',
    green: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
    gold: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
    gray: 'bg-[#2d2d4e] text-[#94a3b8] border-[#2d2d4e]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
