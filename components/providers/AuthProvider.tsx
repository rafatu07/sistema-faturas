'use client';

import { AuthProvider as AuthProviderComponent } from '@/lib/hooks/useAuth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderComponent>{children}</AuthProviderComponent>;
}

