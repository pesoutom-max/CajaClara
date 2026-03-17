import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/header';

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow w-full max-w-4xl mx-auto p-4 flex flex-col">
        <div className="flex items-center mb-8">
            <Button variant="ghost" asChild>
                <Link href="/">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Volver al Dashboard
                </Link>
            </Button>
        </div>
        <div className="w-full max-w-md mx-auto text-center">
          <h1 className="text-4xl font-bold font-headline">Administración de Usuarios</h1>
          <p className="text-muted-foreground mt-2">Próximamente aquí podrás gestionar los usuarios de tu equipo.</p>
        </div>
        <Card className="w-full max-w-md mx-auto mt-8">
            <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Aún no hay funciones disponibles.</p>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
