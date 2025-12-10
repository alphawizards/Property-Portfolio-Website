import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();

  return {
    user: user ? {
      id: user.id,
      name: user.fullName,
      email: user.primaryEmailAddress?.emailAddress,
      // Map Clerk fields to your app's expected shape if needed
      role: user.publicMetadata.role as string || 'user',
      tier: user.publicMetadata.tier as string || 'FREE',
    } : null,
    loading: !isLoaded,
    error: null,
    isAuthenticated: isSignedIn,
    logout: () => signOut(),
  };
}
