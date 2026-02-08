import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useMemberLogin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dumbbell, Users, TrendingUp, Calendar, Shield, Loader2, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const memberLogin = useMemberLogin();
  const navigate = useNavigate();
  
  // Member login state
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberEmail.trim() || !memberPassword.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      const memberProfile = await memberLogin.mutateAsync({
        email: memberEmail.trim(),
        password: memberPassword.trim(),
      });
      
      toast.success('Login successful! Welcome back.');
      
      // Navigate to member dashboard using React Router
      // The mutation's onSuccess already stores the profile in cache and sessionStorage
      navigate({ to: '/' });
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Login failed';
      
      // Enhanced error handling for different error types
      if (errorMessage.includes('Invalid credentials provided')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (errorMessage.includes('reject') || errorMessage.includes('Canister') || errorMessage.includes('canister')) {
        toast.error('Backend service is temporarily unavailable. Please try again in a few minutes.', {
          duration: 6000,
        });
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: 'url(/assets/generated/gym-hero.dim_1200x600.jpg)' }}
        />
        <div className="container relative mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center gap-12 lg:flex-row lg:gap-16">
            {/* Left Side - Branding */}
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-6 flex items-center justify-center gap-4 lg:justify-start">
                <img 
                  src="/assets/1000166652-removebg-preview.png" 
                  alt="Prime Fit Gym Logo" 
                  className="h-24 w-auto object-contain sm:h-28 md:h-32"
                />
              </div>
              <p className="mb-8 text-xl text-muted-foreground">
                Complete Gym Management System
              </p>
              <p className="mb-12 text-lg leading-relaxed text-muted-foreground">
                Streamline your gym operations with our comprehensive management platform. 
                Track memberships, manage trainers, monitor attendance, and grow your fitness business.
              </p>

              {/* Features Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                  <Users className="mt-1 h-5 w-5 text-primary" />
                  <div className="text-left">
                    <h3 className="font-semibold">Member Management</h3>
                    <p className="text-sm text-muted-foreground">Track memberships and profiles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                  <TrendingUp className="mt-1 h-5 w-5 text-primary" />
                  <div className="text-left">
                    <h3 className="font-semibold">Progress Tracking</h3>
                    <p className="text-sm text-muted-foreground">Monitor fitness goals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                  <Calendar className="mt-1 h-5 w-5 text-primary" />
                  <div className="text-left">
                    <h3 className="font-semibold">Class Booking</h3>
                    <p className="text-sm text-muted-foreground">Schedule group sessions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                  <Dumbbell className="mt-1 h-5 w-5 text-primary" />
                  <div className="text-left">
                    <h3 className="font-semibold">Workout Plans</h3>
                    <p className="text-sm text-muted-foreground">Custom training programs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="w-full max-w-md">
              <Card className="border-2 shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-3xl">Welcome to Prime Fit</CardTitle>
                  <CardDescription className="text-base">
                    Sign in to your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Member Login Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Member Login</h3>
                    </div>
                    <form onSubmit={handleMemberLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="member-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="member-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            disabled={memberLogin.isPending}
                            className="pl-9"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="member-password"
                            type="password"
                            placeholder="Enter your password"
                            value={memberPassword}
                            onChange={(e) => setMemberPassword(e.target.value)}
                            disabled={memberLogin.isPending}
                            className="pl-9"
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={memberLogin.isPending}
                        size="lg"
                        className="w-full text-lg font-semibold"
                      >
                        {memberLogin.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          'Sign In as Member'
                        )}
                      </Button>
                    </form>
                    
                    <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Note for Members:</p>
                      <p className="mt-1">Your login credentials are provided by the gym administrator. Contact the admin if you need assistance.</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t-2" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase">
                      <span className="bg-card px-3 text-muted-foreground font-semibold">
                        OR
                      </span>
                    </div>
                  </div>

                  {/* Admin Login Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Admin Login</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Secure authentication for gym administrators
                    </p>
                    
                    {/* Google-styled Sign In Button */}
                    <Button
                      onClick={() => login()}
                      disabled={isLoggingIn}
                      size="lg"
                      variant="outline"
                      className="w-full text-lg font-semibold bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-primary shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <img 
                            src="/assets/generated/google-logo-white.dim_24x24.png" 
                            alt="Google" 
                            className="mr-3 h-5 w-5"
                            onError={(e) => {
                              // Fallback to a colored circle if image fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="flex-1 text-center">Sign in as Admin</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Access Levels:</p>
                    <ul className="space-y-1 pl-4">
                      <li>• <strong>Member:</strong> Email/password login (credentials provided by admin)</li>
                      <li>• <strong>Admin:</strong> Secure authentication (full control)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© 2025. Built with ❤️ using <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">caffeine.ai</a></p>
      </footer>
    </div>
  );
}
