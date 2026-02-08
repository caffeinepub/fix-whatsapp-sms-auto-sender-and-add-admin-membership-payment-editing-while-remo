import { ReactNode, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetMemberProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import ProfileSettings from './ProfileSettings';
import ProfilePictureModal from './ProfilePictureModal';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'admin' | 'member';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: memberProfile } = useGetMemberProfile();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [profilePicModalOpen, setProfilePicModalOpen] = useState(false);

  const handleLogout = async () => {
    if (role === 'member') {
      // Clear member session storage
      sessionStorage.removeItem('memberAuth');
      sessionStorage.removeItem('memberProfileCache');
      queryClient.clear();
      window.location.href = '/';
    } else {
      // Admin logout via Internet Identity
      await clear();
      queryClient.clear();
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'member':
        return 'Member';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Use member profile for members, user profile for admins
  const displayProfile = role === 'member' ? memberProfile : userProfile;
  const profilePicUrl = displayProfile?.profilePic?.getDirectURL();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/1000166652-removebg-preview.png" 
              alt="Prime Fit Gym Logo" 
              className="h-12 w-auto object-contain"
            />
            <div>
              <p className="text-xs text-muted-foreground">{getRoleLabel()} Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2 rounded-full px-3">
                  <Avatar 
                    className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity" 
                    onClick={(e) => {
                      if (profilePicUrl) {
                        e.stopPropagation();
                        setProfilePicModalOpen(true);
                      }
                    }}
                  >
                    {profilePicUrl ? (
                      <AvatarImage src={profilePicUrl} alt={displayProfile?.name} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {displayProfile ? getInitials(displayProfile.name) : 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden sm:inline">{displayProfile?.name || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayProfile?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{displayProfile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {role === 'admin' && (
                  <DropdownMenuItem onClick={() => setProfileSettingsOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          © 2026. Built with ❤️ using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Profile Settings Dialog - only for admins */}
      {role === 'admin' && (
        <ProfileSettings open={profileSettingsOpen} onOpenChange={setProfileSettingsOpen} />
      )}

      {/* Profile Picture Modal */}
      {profilePicUrl && displayProfile && (
        <ProfilePictureModal
          open={profilePicModalOpen}
          onOpenChange={setProfilePicModalOpen}
          imageUrl={profilePicUrl}
          altText={displayProfile.name}
        />
      )}
    </div>
  );
}
