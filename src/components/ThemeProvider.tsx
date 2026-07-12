"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    try {
      const theme = localStorage.getItem('workspace_theme') || 'ocean';
      document.documentElement.setAttribute('data-workspace-theme', theme);
    } catch (e) {}
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
