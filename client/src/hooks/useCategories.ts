import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Category } from '@/types';

export function useCategories() {
  const queryClient = useQueryClient();
  const seeded = useRef(false);

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch('/api/categories') as Promise<Category[]>,
  });

  // Auto-seed default categories for new users
  useEffect(() => {
    if (!loading && categories.length === 0 && !seeded.current) {
      seeded.current = true;
      apiFetch('/api/categories/seed', { method: 'POST' }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }).catch(() => {
        // Silently ignore seed failures
      });
    }
  }, [loading, categories.length, queryClient]);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string; icon?: string }) =>
      apiFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }) as Promise<Category>,
    onSuccess: (category) => {
      queryClient.setQueryData<Category[]>(['categories'], (prev = []) => [
        ...prev,
        category,
      ]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      apiFetch(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }) as Promise<Category>,
    onSuccess: (category) => {
      queryClient.setQueryData<Category[]>(['categories'], (prev = []) =>
        prev.map((c) => (c.id === category.id ? category : c))
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Category[]>(['categories'], (prev = []) =>
        prev.filter((c) => c.id !== id)
      );
    },
  });

  return {
    categories,
    loading,
    createCategory: (data: { name: string; color: string; icon?: string }) =>
      createMutation.mutateAsync(data),
    updateCategory: (id: string, data: Partial<Category>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteCategory: (id: string) => deleteMutation.mutateAsync(id),
    refetch: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  };
}
