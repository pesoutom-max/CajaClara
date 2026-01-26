import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

export function Header() {
  return (
    <header className="w-full max-w-4xl mx-auto p-4 flex justify-between items-center">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Logo className="h-8 w-8" />
        <h1 className="font-headline">Caja Clara</h1>
      </Link>
      <nav className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/dias-anteriores">
            <History className="h-5 w-5 mr-2" />
            <span>Días anteriores</span>
          </Link>
        </Button>
      </nav>
    </header>
  );
}
