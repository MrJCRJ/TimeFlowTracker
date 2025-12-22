import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  updateResolvedTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: (theme: Theme) => {
        set({ theme });
        get().updateResolvedTheme();
      },
      updateResolvedTheme: () => {
        const { theme } = get();
        let resolvedTheme: 'light' | 'dark';

        if (theme === 'system') {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        } else {
          resolvedTheme = theme;
        }

        set({ resolvedTheme });

        // Aplicar classe no documento
        const root = document.documentElement;
        if (resolvedTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Aplicar tema após reidratação
          setTimeout(() => state.updateResolvedTheme(), 0);
        }
      },
    }
  )
);

// Hook simplificado para uso nos componentes
export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useThemeStore();

  return {
    theme,
    setTheme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
  };
}
