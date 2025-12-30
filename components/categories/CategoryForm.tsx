'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { categorySchema, type CategoryInput } from '@/lib/validations';
import { CATEGORY_COLORS, CATEGORY_ICONS, ICON_CATEGORIES } from '@/lib/constants';
import type { Category } from '@/types';
import {
  Briefcase,
  Book,
  BookOpen,
  GraduationCap,
  Search,
  Dumbbell,
  Gamepad2,
  Moon,
  Utensils,
  Car,
  Folder,
  Code,
  Music,
  Video,
  Tv,
  MessageCircle,
  Mail,
  Users,
  Heart,
  ShoppingCart,
  Home,
  Presentation,
  FileText,
  Sparkles,
  Loader2,
  LucideIcon,
} from 'lucide-react';

// Mapa de ícones
const iconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  book: Book,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  search: Search,
  dumbbell: Dumbbell,
  'gamepad-2': Gamepad2,
  moon: Moon,
  utensils: Utensils,
  car: Car,
  folder: Folder,
  code: Code,
  music: Music,
  video: Video,
  tv: Tv,
  'message-circle': MessageCircle,
  mail: Mail,
  users: Users,
  heart: Heart,
  'shopping-cart': ShoppingCart,
  home: Home,
  presentation: Presentation,
  'file-text': FileText,
  sparkles: Sparkles,
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
      <h2 className="text-xl font-semibold">{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</h2>

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
            'w-full rounded-lg border bg-background px-3 py-2',
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
                color === colorOption.value && 'ring-2 ring-primary ring-offset-2'
              )}
              style={{ backgroundColor: colorOption.value }}
              title={colorOption.name}
            />
          ))}
        </div>
        {/* Input manual de cor */}
        <div className="mt-2 flex items-center gap-2">
          <input
            id="category-color"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#RRGGBB"
            aria-label="Cor"
            className={cn(
              'w-32 rounded border bg-background px-3 py-1.5 font-mono text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              errors.color ? 'border-danger' : 'border-input'
            )}
          />
          <div
            className="h-8 w-8 rounded border border-border"
            style={{ backgroundColor: color }}
          />
        </div>
        {errors.color && <p className="text-sm text-danger">{errors.color}</p>}
      </div>

      {/* Campo Ícone */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Ícone <span className="text-danger">*</span>
        </label>

        {/* Ícones agrupados por categoria */}
        <div className="space-y-3" role="group" aria-label="Ícone">
          {ICON_CATEGORIES.map((iconCategory) => {
            const iconsInCategory = CATEGORY_ICONS.filter((i) => i.category === iconCategory.id);

            if (iconsInCategory.length === 0) return null;

            return (
              <div key={iconCategory.id} className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">{iconCategory.name}</p>
                <div className="flex flex-wrap gap-2">
                  {iconsInCategory.map((iconOption) => (
                    <button
                      key={iconOption.value}
                      type="button"
                      data-testid="icon-option"
                      onClick={() => setIcon(iconOption.value)}
                      aria-label={`Ícone ${iconOption.name}`}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg border',
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
              </div>
            );
          })}
        </div>

        {errors.icon && <p className="text-sm text-danger">{errors.icon}</p>}
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-2 text-sm text-muted-foreground">Preview</p>
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
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
            'rounded-lg border border-border px-4 py-2',
            'transition-colors duration-200',
            'hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2',
            'bg-primary font-medium text-primary-foreground',
            'transition-colors duration-200',
            'hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50'
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
