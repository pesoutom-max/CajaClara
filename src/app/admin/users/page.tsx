'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { UserProfile } from '@/lib/user-profiles';
import { UsersTable } from './users-table';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>
        </div>
        <div className="w-full text-center mb-8">
          <h1 className="text-4xl font-bold font-headline">Administración de Usuarios</h1>
          <p className="text-muted-foreground mt-2">Activa o desactiva usuarios del sistema.</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <UsersTable users={users ?? []} currentUserId={currentUser?.uid} />
        )}
      </main>
    </div>
  );
}
