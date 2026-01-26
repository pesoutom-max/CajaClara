import { Header } from '@/components/header';
import { DashboardClient } from '@/components/dashboard-client';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow w-full max-w-4xl mx-auto p-4 flex items-start justify-center">
        <DashboardClient />
      </main>
    </div>
  );
}
