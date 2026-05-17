import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full bg-[#0f0f1a] border border-[#2d2d4e] focus:border-[#7c3aed] rounded-xl px-4 py-3 text-[#e2e8f0] placeholder-[#64748b] outline-none transition-colors text-sm',
        className
      )}
      {...props}
    />
  );
}
