'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-8">
      <Link 
        href="/" 
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === '/' 
            ? 'text-foreground border-b-2 border-primary pb-2' 
            : 'text-muted-foreground'
        }`}
      >
        대시보드
      </Link>
      <Link 
        href="/responses" 
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === '/responses' 
            ? 'text-foreground border-b-2 border-primary pb-2' 
            : 'text-muted-foreground'
        }`}
      >
        응답 브라우징
      </Link>
    </nav>
  );
}