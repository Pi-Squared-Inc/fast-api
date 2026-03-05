'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DEMO_LINKS = [
  { href: '/pay', label: 'Pay' },
  { href: '/merchant', label: 'Merchant Demo' },
  { href: '/paywall', label: 'Paywall Studio' },
  { href: '/payment-links', label: 'Payment Links' },
  { href: '/swap', label: 'Swap Terminal' },
  { href: '/bridge', label: 'Bridge Console' },
  { href: '/sign', label: 'Signature Lab' },
] as const;

const TOOL_LINKS = [
  { href: '/providers', label: 'Providers' },
  { href: '/tokens', label: 'Tokens' },
  { href: '/utils', label: 'Utilities' },
  { href: '/errors', label: 'Errors' },
] as const;

const SIDEBAR_ROUTE_PREFIXES = [
  '/pay',
  '/merchant',
  '/paywall',
  '/payment-links',
  '/swap',
  '/bridge',
  '/sign',
  '/providers',
  '/tokens',
  '/utils',
  '/errors',
] as const;

function pathMatches(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function shouldShowSidebar(pathname: string): boolean {
  return SIDEBAR_ROUTE_PREFIXES.some((prefix) => pathMatches(pathname, prefix));
}

export function DemoSidebarShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';

  if (!shouldShowSidebar(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar" aria-label="Demo navigation">
        <div className="demo-sidebar-group">
          <p className="demo-sidebar-label">Demos</p>
          <nav className="demo-sidebar-nav">
            {DEMO_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`demo-sidebar-link${pathMatches(pathname, link.href) ? ' is-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="demo-sidebar-group">
          <p className="demo-sidebar-label">Tools</p>
          <nav className="demo-sidebar-nav">
            {TOOL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`demo-sidebar-link${pathMatches(pathname, link.href) ? ' is-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="demo-shell-content">{children}</div>
    </div>
  );
}
