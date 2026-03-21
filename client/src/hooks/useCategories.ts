import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { Category } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiFetch('/api/categories');
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(
    async (data: { name: string; color: string; icon?: string }) => {
      const category = await apiFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setCategories((prev) => [...prev, category]);
      return category;
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<Category>) => {
      const category = await apiFetch(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      setCategories((prev) => prev.map((c) => (c.id === id ? category : c)));
      return category;
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
