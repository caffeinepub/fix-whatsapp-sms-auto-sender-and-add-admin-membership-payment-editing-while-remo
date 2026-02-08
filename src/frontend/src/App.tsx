import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerUserRole, useGetMemberProfile } from './hooks/useQueries';
import { UserRole, MemberProfile } from './backend';
import { Loader2, AlertCircle } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import { useActor } from './hooks/useActor';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function App() {
  const { identity, isInitializing, clear } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched, error: profileError } = useGetCallerUserProfile();
  const { data: userRole, isLoading: roleLoading, error: roleError } = useGetCallerUserRole();
  const { data: memberProfile, isLoading: memberProfileLoading } = useGetMemberProfile();
  const queryClient = useQueryClient();

  const [memberAuthState, setMemberAuthState] = useState<{ authenticated: boolean; email?: string; memberId?: string } | null>(null);

  // Check for member authentication in sessionStorage
  useEffect(() => {
    const storedAuth = sessionStorage.getItem('memberAuth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        setMemberAuthState(authData);
      } catch (error) {
        console.error('Failed to parse member auth:', error);
        sessionStorage.removeItem('memberAuth');
        sessionStorage.removeItem('memberProfileCache');
      }
    }
  }, []);

  const isAdminAuthenticated = !!identity;
  const isMemberAuthenticated = memberAuthState?.authenticated === true;
  const isAuthenticated = isAdminAuthenticated || isMemberAuthenticated;

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading Prime Fit...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show error if actor failed to initialize
  if (!actorFetching && !actor && isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>Unable to connect to the backend service. This may be due to:</p>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>Network connectivity issues</li>
                <li>Backend canister not deployed</li>
                <li>Incorrect canister configuration</li>
              </ul>
              <Button onClick={() => window.location.reload()} className="w-full mt-4">
                Retry Connection
              </Button>
            </AlertDescription>
          </Alert>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Not authenticated - show login page
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Member authentication flow - redirect to Member Dashboard
  if (isMemberAuthenticated && !isAdminAuthenticated) {
    // Show loading while actor or member profile is initializing
    if (actorFetching || memberProfileLoading) {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      );
    }

    // Member profile loaded - show Member Dashboard
    if (memberProfile) {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MemberDashboard />
          <Toaster />
        </ThemeProvider>
      );
    }

    // Member authenticated but no profile found - this should not happen with the fallback logic
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Not Found</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>Unable to load your member profile. Please log in again.</p>
              <Button 
                onClick={() => {
                  sessionStorage.removeItem('memberAuth');
                  sessionStorage.removeItem('memberProfileCache');
                  queryClient.clear();
                  window.location.reload();
                }} 
                className="w-full mt-4"
              >
                Return to Login
              </Button>
            </AlertDescription>
          </Alert>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Admin authentication flow (Internet Identity)
  if (isAdminAuthenticated) {
    // Show loading while actor or profile is loading
    if (actorFetching || profileLoading || roleLoading) {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      );
    }

    // Show error if profile or role failed to load
    if (profileError || roleError) {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Profile</AlertTitle>
              <AlertDescription className="mt-2 space-y-4">
                <p>Failed to load your profile or role information.</p>
                <Button onClick={() => window.location.reload()} className="w-full mt-4">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
          <Toaster />
        </ThemeProvider>
      );
    }

    // Admin authenticated and profile loaded - show Admin Dashboard
    if (userProfile && userRole === UserRole.admin) {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AdminDashboard />
          <Toaster />
        </ThemeProvider>
      );
    }

    // Authenticated but not admin - show error
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>You do not have admin access to this application.</p>
              <Button onClick={() => clear()} className="w-full mt-4">
                Logout
              </Button>
            </AlertDescription>
          </Alert>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Fallback - should not reach here
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
