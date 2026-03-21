import { useAuth } from '@/hooks/useAuth';

export function Dashboard() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email || 'there';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to TaskPilot, {name.split(' ')[0]}!
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your AI co-pilot for getting things done.
        </p>
        <p className="text-muted-foreground">
          Task management coming in Sprint 2...
        </p>
      </div>
    </div>
  );
}
