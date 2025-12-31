'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * Input com autocomplete para sugestões de texto
 */
export function AutocompleteInput({
  value,
  onChange,
  onSubmit,
  suggestions,
  placeholder,
  className,
  inputClassName,
}: AutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filtrar sugestões que não sejam exatamente iguais ao valor atual
  const filteredSuggestions = suggestions.filter((s) => s.toLowerCase() !== value.toLowerCase());

  // Mostrar sugestões quando há foco e sugestões disponíveis
  const shouldShowSuggestions = showSuggestions && filteredSuggestions.length > 0;

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index quando sugestões mudam
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredSuggestions.length, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!shouldShowSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
      } else if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          onChange(filteredSuggestions[selectedIndex]);
          setShowSuggestions(false);
        } else {
          onSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          e.preventDefault();
          onChange(filteredSuggestions[selectedIndex]);
          setShowSuggestions(false);
        }
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-md px-3 py-2 text-sm',
          'border border-input bg-background',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          inputClassName
        )}
        autoComplete="off"
      />

      {/* Dropdown de sugestões */}
      {shouldShowSuggestions && (
        <div
          ref={suggestionsRef}
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-1',
            'max-h-40 overflow-y-auto rounded-md border border-border',
            'bg-popover shadow-lg'
          )}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                'transition-colors hover:bg-muted',
                index === selectedIndex && 'bg-muted'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
