import React, { createContext, useContext, useEffect, useState } from "react";

const MockAuthContext = createContext({
  isSignedIn: false,
  isLoaded: true,
  user: null as any,
  signOut: async () => {},
});

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(true); // Default to signed in for dev
  const user = {
    id: "user_mock_123",
    fullName: "Mock User",
    firstName: "Mock",
    lastName: "User",
    primaryEmailAddress: { emailAddress: "mock@example.com" },
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    publicMetadata: { role: "user", tier: "PREMIUM_MONTHLY" },
  };

  const signOut = async () => setIsSignedIn(false);

  return (
    <MockAuthContext.Provider value={{ isSignedIn, isLoaded: true, user, signOut }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useAuth() {
  const { isSignedIn, isLoaded, signOut } = useContext(MockAuthContext);
  return { isSignedIn, isLoaded, signOut, userId: isSignedIn ? "user_mock_123" : null };
}

export function useUser() {
  const { isSignedIn, isLoaded, user } = useContext(MockAuthContext);
  return { isSignedIn, isLoaded, user: isSignedIn ? user : null };
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return !isSignedIn ? <>{children}</> : null;
}

export function RedirectToSignIn() {
  return <div>Redirecting to Sign In...</div>;
}

export function SignInButton({ children, mode }: any) {
  return <button onClick={() => window.location.href = "/dashboard"}>{children || "Sign In"}</button>;
}

export function SignUpButton({ children, mode }: any) {
  return <button onClick={() => window.location.href = "/dashboard"}>{children || "Sign Up"}</button>;
}

export function UserButton() {
  const { user, signOut } = useContext(MockAuthContext);
  if (!user) return null;
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <img src={user.imageUrl} style={{ width: 32, height: 32, borderRadius: "50%" }} />
      <button onClick={signOut} style={{ fontSize: "12px", color: "red" }}>Sign Out</button>
    </div>
  );
}
