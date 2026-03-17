'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/user-profiles';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(profileRef);

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!isUserLoading && !user) {
      router.replace('/login');
      return;
    }
    
    // Once profile is loaded, check the role
    if (!isProfileLoading && userProfile) {
      if (userProfile.role !== 'master') {
        router.replace('/'); // Redirect non-master users to dashboard
      }
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  // Show a loading spinner while checking auth and profile
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is a master, show the admin content
  if (userProfile && userProfile.role === 'master') {
    return <>{children}</>;
  }

  // Fallback, should be covered by useEffect redirects
  return null;
}
