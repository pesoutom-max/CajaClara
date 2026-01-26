'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, Timestamp } from 'firebase/firestore';

interface DailySummary {
  date: string;
  sales: number;
  expenses: number;
}

export default function PreviousDaysPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const salesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'sales'));
  }, [firestore, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'));
  }, [firestore, user]);

  const { data: sales, isLoading: salesLoading } = useCollection<{amount: number, timestamp: Timestamp}>(salesQuery);
  const { data: expenses, isLoading: expensesLoading } = useCollection<{amount: number, timestamp: Timestamp}>(expensesQuery);

  const previousDays = useMemo(() => {
    if (!sales || !expenses) return [];

    const summaries: { [key: string]: { sales: number; expenses: number; dateObj: Date } } = {};

    const allTransactions = [
      ...sales.map(s => ({ ...s, type: 'sale' })),
      ...expenses.map(e => ({ ...e, type: 'expense' }))
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allTransactions.forEach(transaction => {
      if (!transaction.timestamp) return;
      const date = transaction.timestamp.toDate();

      if (date >= today) return;

      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!summaries[dateKey]) {
        summaries[dateKey] = { sales: 0, expenses: 0, dateObj: date };
      }

      if (transaction.type === 'sale') {
        summaries[dateKey].sales += transaction.amount;
      } else {
        summaries[dateKey].expenses += transaction.amount;
      }
    });

    const sortedKeys = Object.keys(summaries).sort().reverse();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);


    return sortedKeys.map(key => {
      const { sales, expenses, dateObj } = summaries[key];
      let dateString;
      
      const dateObjAtMidnight = new Date(dateObj);
      dateObjAtMidnight.setHours(0,0,0,0);
      
      if (dateObjAtMidnight.getTime() === yesterday.getTime()) {
        dateString = `Ayer, ${dateObj.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}`;
      } else {
        dateString = dateObj.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
        dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
      }
      
      return { date: dateString, sales, expenses };
    });

  }, [sales, expenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };
  
  if (isUserLoading || salesLoading || expensesLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

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
          {previousDays.length === 0 && (
             <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Aún no hay datos de días anteriores.</p>
                </CardContent>
              </Card>
          )}
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
