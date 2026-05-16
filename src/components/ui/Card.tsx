import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
