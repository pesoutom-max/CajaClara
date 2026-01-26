import { Header } from '@/components/header';
import { DashboardClient } from '@/components/dashboard-client';

export default function Home() {
  const todaySummary = {
    totalSales: 72550,
    totalExpenses: 15200,
    cashInHand: 43350,
  };

  const quickProducts = [
    { id: '1', name: 'Bebida 1.5L', price: 2000 },
    { id: '2', name: 'Pan Amasado', price: 300 },
    { id: '3', name: 'Kilo de Palta', price: 4500 },
    { id: '4', name: 'Cigarros', price: 3500 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow w-full max-w-4xl mx-auto p-4 flex items-start justify-center">
        <DashboardClient summary={todaySummary} quickProducts={quickProducts} />
      </main>
    </div>
  );
}
