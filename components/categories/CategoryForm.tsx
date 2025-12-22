'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { categorySchema, type CategoryInput } from '@/lib/validations';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/constants';
import type { Category } from '@/types';
import {
  Briefcase,
  Book,
  Dumbbell,
  Gamepad2,
  Moon,
  Utensils,
  Car,
  Folder,
  Code,
  Music,
  Video,
  MessageCircle,
  Mail,
  Users,
  Heart,
  ShoppingCart,
  Loader2,
  LucideIcon,
} from 'lucide-react';

// Mapa de ícones
const iconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  book: Book,
  dumbbell: Dumbbell,
  'gamepad-2': Gamepad2,
  moon: Moon,
  utensils: Utensils,
  car: Car,
  folder: Folder,
  code: Code,
  music: Music,
  video: Video,
  'message-circle': MessageCircle,
  mail: Mail,
  users: Users,
  heart: Heart,
  'shopping-cart': ShoppingCart,
};

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryInput) => Promise<void> | void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  color?: string;
  icon?: string;
}

/**
 * CategoryForm - Formulário para criar/editar categorias
 * 
 * Funcionalidades:
 * - Campos para nome, cor e ícone
 * - Validação em tempo real
 * - Suporte a criação e edição
 * - Seletor visual de cores e ícones
 */
export function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const isEditing = !!category;

  // Estado do formulário
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0].value);
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICONS[0].value);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação
  const validate = useCallback((): boolean => {
    const result = categorySchema.safeParse({ name, color, icon });

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        newErrors[field] = err.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [name, color, icon]);

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), color, icon });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderiza ícone
  const renderIcon = (iconName: string, size: 'sm' | 'md' = 'sm') => {
    const Icon = iconMap[iconName] || Folder;
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return <Icon className={sizeClass} />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <h2 className="text-xl font-semibold">
        {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
      </h2>

      {/* Campo Nome */}
      <div className="space-y-2">
        <label htmlFor="category-name" className="block text-sm font-medium">
          Nome <span className="text-danger">*</span>
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Reuniões"
          maxLength={50}
          aria-label="Nome"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={cn(
            'w-full px-3 py-2 rounded-lg border bg-background',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            errors.name ? 'border-danger' : 'border-input'
          )}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-danger">
            {errors.name}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{name.length}/50 caracteres</p>
      </div>

      {/* Campo Cor */}
      <div className="space-y-2">
        <label htmlFor="category-color" className="block text-sm font-medium">
          Cor <span className="text-danger">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              data-testid="color-option"
              onClick={() => setColor(colorOption.value)}
              aria-label={`Cor ${colorOption.name}`}
              className={cn(
                'h-8 w-8 rounded-full transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                color === colorOption.value && 'ring-2 ring-offset-2 ring-primary'
              )}
              style={{ backgroundColor: colorOption.value }}
              title={colorOption.name}
            />
          ))}
        </div>
        {/* Input manual de cor */}
        <div className="flex items-center gap-2 mt-2">
          <input
            id="category-color"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#RRGGBB"
            aria-label="Cor"
            className={cn(
              'w-32 px-3 py-1.5 rounded border bg-background text-sm font-mono',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              errors.color ? 'border-danger' : 'border-input'
            )}
          />
          <div
            className="h-8 w-8 rounded border border-border"
            style={{ backgroundColor: color }}
          />
        </div>
        {errors.color && (
          <p className="text-sm text-danger">{errors.color}</p>
        )}
      </div>

      {/* Campo Ícone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Ícone <span className="text-danger">*</span>
        </label>
        <div 
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Ícone"
        >
          {CATEGORY_ICONS.map((iconOption) => (
            <button
              key={iconOption.value}
              type="button"
              data-testid="icon-option"
              onClick={() => setIcon(iconOption.value)}
              aria-label={`Ícone ${iconOption.name}`}
              className={cn(
                'flex items-center justify-center h-10 w-10 rounded-lg border',
                'transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                icon === iconOption.value
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              )}
              title={iconOption.name}
            >
              {renderIcon(iconOption.value, 'md')}
            </button>
          ))}
        </div>
        {errors.icon && (
          <p className="text-sm text-danger">{errors.icon}</p>
        )}
      </div>

      {/* Preview */}
      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <p className="text-sm text-muted-foreground mb-2">Preview</p>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg"
            style={{ backgroundColor: color + '20' }}
          >
            <span style={{ color }}>{renderIcon(icon, 'md')}</span>
          </div>
          <span className="font-medium">{name || 'Nome da categoria'}</span>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={cn(
            'px-4 py-2 rounded-lg border border-border',
            'transition-colors duration-200',
            'hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-primary text-primary-foreground font-medium',
            'transition-colors duration-200',
            'hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;
