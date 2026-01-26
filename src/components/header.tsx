'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { History, LogOut } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="w-full max-w-4xl mx-auto p-4 flex justify-between items-center">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Logo className="h-8 w-8" />
        <h1 className="font-headline">Caja Clara</h1>
      </Link>
      <nav className="flex items-center gap-2">
        {user ? (
          <>
            <Button variant="ghost" asChild>
              <Link href="/dias-anteriores">
                <History className="h-5 w-5 mr-2" />
                <span>Días anteriores</span>
              </Link>
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-5 w-5 mr-2" />
              Cerrar sesión
            </Button>
          </>
        ) : null}
      </nav>
    </header>
  );
}
