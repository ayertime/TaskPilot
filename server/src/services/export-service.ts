interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  category_name?: string;
  completed_at: string | null;
  created_at: string;
}

export function exportTasksCsv(tasks: TaskRow[]): string {
  const headers = [
    'Title',
    'Status',
    'Priority',
    'Due Date',
    'Category',
    'Completed At',
    'Created At',
  ];

  const rows = tasks.map((t) => [
    csvEscape(t.title),
    t.status,
    t.priority,
    t.due_date || '',
    t.category_name || '',
    t.completed_at || '',
    t.created_at,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportTasksMarkdown(tasks: TaskRow[]): string {
  const lines: string[] = ['# Tasks Export', ''];

  const grouped: Record<string, TaskRow[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };

  for (const task of tasks) {
    (grouped[task.status] || grouped.todo).push(task);
  }

  const labels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };

  for (const [status, label] of Object.entries(labels)) {
    const group = grouped[status];
    if (group.length === 0) continue;

    lines.push(`## ${label} (${group.length})`, '');

    for (const task of group) {
      const check = status === 'done' ? 'x' : ' ';
      const priority =
        task.priority !== 'medium' ? ` [${task.priority.toUpperCase()}]` : '';
      const due = task.due_date
        ? ` — due ${new Date(task.due_date).toLocaleDateString()}`
        : '';
      const cat = task.category_name ? ` (${task.category_name})` : '';

      lines.push(`- [${check}] **${task.title}**${priority}${due}${cat}`);
      if (task.description) {
        lines.push(`  ${task.description}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
