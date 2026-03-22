import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useProfile } from '@/hooks/useProfile';
import { applyTheme, applyAccentColor } from '@/lib/theme';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
import { ChatPanel } from '@/components/chat/ChatPanel';
import {
  LogOut,
  Settings,
  User,
  LayoutDashboard,
  Plus,
  X,
  MessageSquare,
  Activity,
  Menu,
} from 'lucide-react';
import { toast } from 'sonner';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { categories, createCategory, deleteCategory } = useCategories();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ctrl+K to toggle chat panel
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setChatOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Live clock
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeZone = (() => {
    try {
      if (profile?.timezone) {
        Intl.DateTimeFormat(undefined, { timeZone: profile.timezone });
        return profile.timezone;
      }
    } catch { /* invalid timezone, fall back */ }
    return undefined;
  })();

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone,
  });

  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  });

  const displayName =
    user?.user_metadata?.full_name || user?.email || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Apply saved theme + accent color when profile loads
  useEffect(() => {
    if (profile) {
      applyTheme(profile.theme);
      if (profile.accent_color && profile.accent_color !== '#6366f1') {
        applyAccentColor(profile.accent_color);
      }
    }
  }, [profile]);

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
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b bg-card sticky top-0 z-50"
      >
        <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <Menu className="h-5 w-5" />
            </Button>
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

          <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end mr-1 text-right">
            <span className="text-sm font-medium leading-none tabular-nums">{formattedTime}</span>
            <span className="text-[11px] text-muted-foreground leading-tight">{formattedDate}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">AI Chat</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              Ctrl+K
            </kbd>
          </Button>

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
        </div>
      </motion.header>

      {/* Body */}
      <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 top-14 md:top-0 md:static z-40 w-60 border-r bg-card flex flex-col overflow-y-auto transition-transform duration-200 md:transition-none md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <nav className="p-3 space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                buttonVariants({ variant: location.pathname === '/dashboard' ? 'secondary' : 'ghost' }),
                'w-full justify-start'
              )}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tasks
            </Link>
            <Link
              to="/activity"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                buttonVariants({ variant: location.pathname === '/activity' ? 'secondary' : 'ghost' }),
                'w-full justify-start'
              )}
            >
              <Activity className="mr-2 h-4 w-4" />
              Activity
            </Link>
            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                buttonVariants({ variant: location.pathname === '/settings' ? 'secondary' : 'ghost' }),
                'w-full justify-start'
              )}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet context={{ categories }} />
        </main>
      </div>

      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        onSubmit={handleCreateCategory}
      />

      <ChatPanel open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
