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
                className="w-full"
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
  // Show error if profile fetch failed
  if (profileError && isAdminAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Error</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>Failed to load your profile. Please try again.</p>
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} className="flex-1">
                  Retry
                </Button>
                <Button onClick={() => clear()} variant="outline" className="flex-1">
                  Logout
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show loading while fetching profile
  if ((profileLoading || actorFetching) && !profileFetched) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Authenticated but no profile - this shouldn't happen in normal flow
  // Members are created by admins, admins register through the login page
  if (isAdminAuthenticated && profileFetched && userProfile === null) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Not Found</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>No profile found for your account. Please contact the gym administrator to set up your account.</p>
              <p className="text-sm text-muted-foreground">
                Note: Member accounts must be created by the gym administrator. If you are an administrator, please register through the login page.
              </p>
              <Button onClick={() => clear()} className="w-full">
                Return to Login
              </Button>
            </AlertDescription>
          </Alert>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show error if role fetch failed
  if (roleError && isAdminAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authorization Error</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>Failed to verify your access level. Please try again.</p>
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} className="flex-1">
                  Retry
                </Button>
                <Button onClick={() => clear()} variant="outline" className="flex-1">
                  Logout
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show loading while fetching role
  if (roleLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Route based on user role (Admin only at this point)
  const renderDashboard = () => {
    if (!userRole) {
      return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>Unable to determine your access level. Please contact support.</p>
              <Button onClick={() => clear()} className="w-full">
                Logout
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    switch (userRole) {
      case UserRole.admin:
        return <AdminDashboard />;
      case UserRole.user:
        // Internet Identity users with 'user' role should also go to Member Dashboard
        return <MemberDashboard />;
      default:
        return (
          <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription className="mt-2 space-y-4">
                <p>You don't have permission to access this application.</p>
                <Button onClick={() => clear()} className="w-full">
                  Logout
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        );
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {renderDashboard()}
      <Toaster />
    </ThemeProvider>
  );
}
