import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Category } from '@/types';

export function useCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch('/api/categories') as Promise<Category[]>,
  });

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
