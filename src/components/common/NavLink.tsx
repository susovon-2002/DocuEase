'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavLinkProps extends React.ComponentProps<typeof Link> {
  isActive?: boolean;
  activeClassName?: string;
  inactiveClassName?: string;
}

export function NavLink({
  href,
  isActive,
  activeClassName = 'text-primary font-semibold',
  inactiveClassName = 'text-muted-foreground',
  className,
  children,
  ...props
}: NavLinkProps) {
  return (
    <Link href={href} className={cn(className, isActive ? activeClassName : inactiveClassName)} {...props}>
      {children}
    </Link>
  );
}
