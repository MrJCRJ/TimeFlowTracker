'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Moon, Sun } from 'lucide-react';

interface AppearanceSectionProps {
  theme: 'light' | 'dark' | 'system';
  isDark: boolean;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * AppearanceSection - Seção de aparência nas configurações
 */
export function AppearanceSection({ theme, isDark, onThemeChange }: AppearanceSectionProps) {
  const toggleDarkMode = () => {
    onThemeChange(isDark ? 'light' : 'dark');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          Aparência
        </CardTitle>
        <CardDescription>Personalize a aparência do aplicativo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tema */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label htmlFor="dark-mode">Modo Escuro</Label>
            <p className="text-sm text-muted-foreground">
              Ative o modo escuro para reduzir a fadiga ocular
            </p>
          </div>
          <Switch
            id="dark-mode"
            checked={isDark}
            onCheckedChange={toggleDarkMode}
          />
        </div>

        {/* Seletor de tema */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onThemeChange('light')}
            className="flex-1"
          >
            <Sun className="mr-2 h-4 w-4" />
            Claro
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onThemeChange('dark')}
            className="flex-1"
          >
            <Moon className="mr-2 h-4 w-4" />
            Escuro
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onThemeChange('system')}
            className="flex-1"
          >
            Sistema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
