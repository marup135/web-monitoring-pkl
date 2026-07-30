"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function SystemThemeHandler() {
  const { theme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    let observer: MutationObserver;
    
    const enforceSystemTheme = () => {
      try {
        const storedTheme = localStorage.getItem('theme') || theme;
        if (storedTheme === 'system') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) {
            if (!document.documentElement.classList.contains('dark')) {
              document.documentElement.classList.add('dark');
              document.documentElement.classList.remove('light');
            }
          } else {
            if (!document.documentElement.classList.contains('light')) {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
            }
          }
        }
      } catch (e) {}
    };

    enforceSystemTheme();

    observer = new MutationObserver(() => {
      enforceSystemTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => enforceSystemTheme();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      observer.disconnect();
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  }, [theme, resolvedTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    try {
      const theme = localStorage.getItem('workspace_theme') || 'ocean';
      document.documentElement.setAttribute('data-workspace-theme', theme);
    } catch (e) {}
  }, []);

  return (
    <NextThemesProvider {...props}>
      <SystemThemeHandler />
      {children}
    </NextThemesProvider>
  );
}

