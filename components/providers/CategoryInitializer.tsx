'use client';

import { useEffect } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';

interface CategoryInitializerProps {
  userId: string;
}

/**
 * CategoryInitializer - Silently initializes default categories if none exist
 * This component renders nothing and runs only once on mount
 */
export function CategoryInitializer({ userId }: CategoryInitializerProps) {
  const { categories, initializeDefaults } = useCategoryStore();

  useEffect(() => {
    // Only initialize if no categories exist
    if (categories.length === 0 && userId) {
      initializeDefaults(userId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Render nothing
  return null;
}
