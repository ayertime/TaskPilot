import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import type { Task, Category } from '@/types';

interface SortableTaskCardProps {
  task: Task;
  categories: Category[];
  onView?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onStatusChange: (status: Task['status']) => void;
}

export function SortableTaskCard(props: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: props.task.id,
    data: { type: 'task', task: props.task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : 'transform 150ms ease',
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard {...props} />
    </div>
  );
}
