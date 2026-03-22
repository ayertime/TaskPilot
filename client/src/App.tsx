import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { LandingPage } from '@/components/landing/LandingPage';
import { LoginPage } from '@/components/auth/LoginPage';
import { AuthCallback } from '@/components/auth/AuthCallback';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskBoard } from '@/components/dashboard/TaskBoard';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { ActivityLog } from '@/components/activity/ActivityLog';

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <TaskBoard /> },
          { path: '/activity', element: <ActivityLog /> },
          { path: '/settings', element: <ProfileSettings /> },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
