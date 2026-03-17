'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SignupDisabledPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Registro Deshabilitado</CardTitle>
          <CardDescription>La creación de nuevas cuentas debe ser realizada por un administrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Si ya tienes una cuenta, puedes{' '}
            <Link href="/login" className="underline font-medium text-primary">
              iniciar sesión
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
