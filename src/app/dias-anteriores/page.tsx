import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PreviousDaysPage() {
  const previousDays = [
    { date: 'Ayer, 23 de Julio', sales: 85200, expenses: 25000 },
    { date: 'Lunes, 22 de Julio', sales: 67300, expenses: 12450 },
    { date: 'Domingo, 21 de Julio', sales: 110500, expenses: 5000 },
    { date: 'Sábado, 20 de Julio', sales: 135800, expenses: 45000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="w-full max-w-4xl mx-auto p-4 flex items-center">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </Link>
        </Button>
      </header>
      <main className="flex-grow w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-md text-center mb-8">
          <h1 className="text-4xl font-bold font-headline">Días anteriores</h1>
          <p className="text-muted-foreground mt-2">Para ver cómo te fue otros días.</p>
        </div>
        <div className="w-full max-w-md space-y-4">
          {previousDays.map((day) => (
            <Card key={day.date} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{day.date}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Vendido</p>
                  <p className="text-lg font-semibold text-positive">{formatCurrency(day.sales)}</p>
                </div>
                 <div className="text-right">
                  <p className="text-sm text-muted-foreground">Gastado</p>
                  <p className="text-lg font-semibold text-negative">{formatCurrency(day.expenses)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
