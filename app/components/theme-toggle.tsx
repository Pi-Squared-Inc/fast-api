'use client';

import { useEffect, useState } from 'react';

type ThemePreference = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'money-theme-preference';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'system';
}

function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

function applyTheme(preference: ThemePreference): ResolvedTheme {
  const prefersDark = window.matchMedia(DARK_QUERY).matches;
  const resolved = resolveTheme(preference, prefersDark);
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  if (preference === 'system') {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  }
  return resolved;
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const rootPref = document.documentElement.dataset.themePreference;
    const initialPreference: ThemePreference =
      rootPref === 'light' || rootPref === 'dark' || rootPref === 'system'
        ? rootPref
        : readPreference();
    setPreference(initialPreference);
    setResolved(applyTheme(initialPreference));

    const media = window.matchMedia(DARK_QUERY);
    const onSystemThemeChange = () => {
      const currentPreference = (document.documentElement.dataset.themePreference ?? 'system') as ThemePreference;
      if (currentPreference !== 'system') return;
      setResolved(applyTheme('system'));
    };

    media.addEventListener('change', onSystemThemeChange);
    return () => media.removeEventListener('change', onSystemThemeChange);
  }, []);

  const nextMode: ThemePreference = resolved === 'dark' ? 'light' : 'dark';
  const title =
    preference === 'system'
      ? `Theme: System (${resolved}). Click to switch to ${nextMode}.`
      : `Theme: ${resolved}. Click to switch to ${nextMode}.`;

  const toggleTheme = () => {
    const nextPreference: ThemePreference = resolved === 'dark' ? 'light' : 'dark';
    setPreference(nextPreference);
    setResolved(applyTheme(nextPreference));
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={title}
      aria-label={title}
    >
      {resolved === 'dark' ? (
        <svg viewBox="0 0 24 24" className="theme-toggle-icon" aria-hidden="true">
          <path
            d="M20 12.8A8 8 0 1 1 11.2 4a7 7 0 0 0 8.8 8.8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="theme-toggle-icon" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className="sr-only">{title}</span>
    </button>
  );
}
