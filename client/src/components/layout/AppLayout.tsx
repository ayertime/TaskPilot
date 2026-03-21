import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryForm } from './CategoryForm';
import {
  LogOut,
  Settings,
  User,
  LayoutDashboard,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { categories, createCategory, deleteCategory } = useCategories();
  const location = useLocation();
  const navigate = useNavigate();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);

  const displayName =
    user?.user_metadata?.full_name || user?.email || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Load and apply saved theme on mount
  useEffect(() => {
    apiFetch('/api/profile')
      .then((profile) => {
        if (profile?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (profile?.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          const isDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;
          document.documentElement.classList.toggle('dark', isDark);
        }
      })
      .catch(() => {});
  }, []);

  async function handleCreateCategory(data: {
    name: string;
    color: string;
  }) {
    try {
      await createCategory(data);
      toast.success('Category created');
    } catch {
      toast.error('Failed to create category');
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-primary-foreground"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold">TaskPilot</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-accent transition-colors cursor-pointer focus:outline-none">
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Body */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-60 border-r bg-card/50 flex flex-col overflow-y-auto">
          <nav className="p-3 space-y-1">
            <Button
              variant={location.pathname === '/' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => navigate('/')}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tasks
            </Button>
            <Button
              variant={
                location.pathname === '/settings' ? 'secondary' : 'ghost'
              }
              className="w-full justify-start"
              onClick={() => navigate('/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </nav>

          <Separator />

          <div className="p-3 flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Categories
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCategoryFormOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-0.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate flex-1">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1">
                  No categories yet
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ categories }} />
        </main>
      </div>

      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        onSubmit={handleCreateCategory}
      />
    </div>
  );
}
