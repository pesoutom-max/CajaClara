"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MinusCircle, PlusCircle, Info, Loader2, CheckCircle2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, Timestamp, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import type { UserProfile } from '@/lib/user-profiles';
import { Header } from '@/components/header';
import { DailyCloseDialog } from '@/components/daily-close-dialog';
import { useUserProfile } from '@/hooks/use-user-profile';

const saleSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser un número positivo."),
  paymentMethod: z.enum(['efectivo', 'debito', 'transferencia'], { required_error: 'Debes seleccionar un método de pago.' }),
});

const expenseSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser un número positivo."),
  reason: z.string().min(1, "Debes ingresar un motivo."),
});

export function DashboardClient() {
  const [isSaleOpen, setSaleOpen] = useState(false);
  const [isExpenseOpen, setExpenseOpen] = useState(false);
  const [formattedSaleAmount, setFormattedSaleAmount] = useState('');
  const [formattedExpenseAmount, setFormattedExpenseAmount] = useState('');
  const [isDailyCloseOpen, setDailyCloseOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Check user profile and redirect if must change password
  useUserProfile();

  const profileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(profileRef);

  const { today, tomorrow } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { today, tomorrow };
  }, []);

  const salesQuery = useMemoFirebase(() => {
    if (!user || (userProfile && !userProfile.isActive)) return null;
    return query(
      collection(firestore, 'users', user.uid, 'sales'),
      where('timestamp', '>=', Timestamp.fromDate(today)),
      where('timestamp', '<', Timestamp.fromDate(tomorrow))
    );
  }, [firestore, user, today, tomorrow, userProfile]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user || (userProfile && !userProfile.isActive)) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('timestamp', '>=', Timestamp.fromDate(today)),
      where('timestamp', '<', Timestamp.fromDate(tomorrow))
    );
  }, [firestore, user, today, tomorrow, userProfile]);

  const { data: sales, isLoading: salesLoading } = useCollection<{amount: number, paymentMethod: string}>(salesQuery);
  const { data: expenses, isLoading: expensesLoading } = useCollection<{amount: number}>(expensesQuery);

  const saleForm = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      paymentMethod: 'efectivo',
    },
  });

  const expenseForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
  });

  const handleAddSale = (values: z.infer<typeof saleSchema>) => {
    if (!user) return;
    const salesCollection = collection(firestore, 'users', user.uid, 'sales');
    addDocumentNonBlocking(salesCollection, {
      ...values,
      timestamp: serverTimestamp(),
    }).then(() => {
      toast({
        title: "Venta guardada",
        description: "Tu venta ha sido registrada con éxito.",
      })
    });
    saleForm.reset();
    setFormattedSaleAmount('');
    setSaleOpen(false);
  };

  const handleAddExpense = (values: z.infer<typeof expenseSchema>) => {
    if (!user) return;
    const expensesCollection = collection(firestore, 'users', user.uid, 'expenses');
    addDocumentNonBlocking(expensesCollection, {
      ...values,
      timestamp: serverTimestamp(),
    }).then(() => {
      toast({
        title: "Gasto guardado",
        description: "Tu gasto ha sido registrado con éxito.",
      })
    });
    expenseForm.reset();
    setFormattedExpenseAmount('');
    setExpenseOpen(false);
  };

  const summary = useMemo(() => {
    const totalSales = (sales || []).reduce((sum, sale: any) => sum + (Number(sale.amount) || 0), 0);
    const totalExpenses = (expenses || []).reduce((sum, expense: any) => sum + (Number(expense.amount) || 0), 0);
    const cashSales = (sales || []).filter((s: any) => s.paymentMethod === 'efectivo').reduce((sum, sale: any) => sum + (Number(sale.amount) || 0), 0);
    const debitSales = (sales || []).filter((s: any) => s.paymentMethod === 'debito').reduce((sum, sale: any) => sum + (Number(sale.amount) || 0), 0);
    const transferSales = (sales || []).filter((s: any) => s.paymentMethod === 'transferencia').reduce((sum, sale: any) => sum + (Number(sale.amount) || 0), 0);
    
    // Ensure we don't return NaN values to Firestore later
    const expectedCash = Math.max(0, cashSales - totalExpenses);

    return { 
      totalSales: Math.max(0, totalSales), 
      totalExpenses: Math.max(0, totalExpenses), 
      expectedCash,
      paymentMethods: {
        efectivo: Math.max(0, cashSales),
        debito: Math.max(0, debitSales),
        transferencia: Math.max(0, transferSales)
      }
    };
  }, [sales, expenses]);


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };
  
  const renderContent = () => {
    if (isUserLoading || (user && isProfileLoading)) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
  
    if (!user) {
      return (
         <div className="w-full max-w-lg text-center mt-8">
          <h1 className="text-5xl font-bold font-headline">Tu negocio, en orden.</h1>
          <p className="text-xl text-muted-foreground mt-4">Caja Clara <span className="text-base font-normal">by FacilPyme.cl</span> te ayuda a tener claridad sobre tus ventas y gastos diarios, sin esfuerzo.</p>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="h-12 text-lg">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </div>
      );
    }

    if (user && !userProfile && !isProfileLoading) {
      return (
        <div className="w-full max-w-lg mx-auto mt-8 text-center">
            <Card className="border-primary/50 bg-secondary/30">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-foreground">
                        <Info /> Perfil no encontrado
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4 pt-6">
                    <p>Tu cuenta de usuario está autenticada, pero no tiene un perfil de datos asociado en Firestore.</p>
                    <p className="font-semibold">Si eres el administrador, debes crear tu documento de perfil manualmente en la base de datos para completar la configuración inicial.</p>
                </CardContent>
            </Card>
        </div>
      );
    }

    if (userProfile && !userProfile.isActive) {
        return (
            <div className="w-full max-w-lg mx-auto mt-8 text-center">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Cuenta Desactivada</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p>Tu cuenta se encuentra desactivada. Por favor, contacta al administrador para más información.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (salesLoading || expensesLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className="w-full max-w-md flex flex-col gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Así va tu día</CardTitle>
            <CardDescription>Resumen de hoy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
              <span className="text-lg">Hoy llevas vendidos</span>
              <span className="text-2xl font-bold text-positive">{formatCurrency(summary.totalSales)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
              <span className="text-lg">Hoy llevas gastado</span>
              <span className="text-2xl font-bold text-negative">{formatCurrency(summary.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-accent rounded-lg ring-2 ring-primary/50">
              <span className="text-lg font-semibold">Lo que debería haber en la caja</span>
              <span className="text-2xl font-bold">{formatCurrency(summary.expectedCash)}</span>
            </div>
          </CardContent>
        </Card>
  
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Button size="lg" className="h-16 text-lg" onClick={() => setSaleOpen(true)}>
              <PlusCircle className="mr-2 h-6 w-6" /> Sumar venta
            </Button>
            <Button size="lg" variant="secondary" className="h-16 text-lg" onClick={() => setExpenseOpen(true)}>
              <MinusCircle className="mr-2 h-6 w-6" /> Anotar gasto
            </Button>
          </div>
          <Button 
            size="lg" 
            variant="outline" 
            className="h-14 border-primary text-primary hover:bg-primary/5 font-semibold"
            onClick={() => setDailyCloseOpen(true)}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" /> Cerrar Caja del Día
          </Button>
        </div>
        
        <div className="text-center text-foreground p-4 rounded-lg bg-secondary/50">
          <Info className="inline-block mr-2 h-5 w-5" />
          <p className="inline text-base">Con esto ya sabes cómo te fue hoy. <br/> <strong>No necesitas sumar nada.</strong></p>
        </div>
  
        {/* Dialogs */}
        <Dialog open={isSaleOpen} onOpenChange={(open) => { setSaleOpen(open); if(!open) { saleForm.reset(); setFormattedSaleAmount(''); } }}>
          <DialogContent>
            <Form {...saleForm}>
              <form onSubmit={saleForm.handleSubmit(handleAddSale)}>
                <DialogHeader>
                  <DialogTitle className="text-2xl">Sumar venta</DialogTitle>
                  <DialogDescription>
                    Anota el monto y listo.<br />
                    No necesitas escribir qué vendiste.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={saleForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel className="text-base">Monto</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: 1500"
                            className="h-12 text-lg"
                            inputMode="numeric"
                            type="text"
                            value={formattedSaleAmount}
                            onChange={e => {
                              const rawValue = e.target.value.replace(/[^\d]/g, '');
                              if (rawValue === '') {
                                setFormattedSaleAmount('');
                                field.onChange(undefined);
                              } else {
                                const numberValue = parseInt(rawValue, 10);
                                if (!isNaN(numberValue)) {
                                  setFormattedSaleAmount(new Intl.NumberFormat('es-CL').format(numberValue));
                                  field.onChange(numberValue);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">No tiene que ser exacto al peso. Es para tener claridad.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={saleForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">¿Cómo te pagaron?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4 pt-2"
                          >
                            <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                              <RadioGroupItem value="efectivo" /> Efectivo
                            </Label>
                            <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                              <RadioGroupItem value="debito" /> Débito
                            </Label>
                            <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                              <RadioGroupItem value="transferencia" /> Transf.
                            </Label>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit">Guardar Venta</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isExpenseOpen} onOpenChange={(open) => { setExpenseOpen(open); if(!open) { expenseForm.reset(); setFormattedExpenseAmount(''); }}}>
          <DialogContent>
             <Form {...expenseForm}>
              <form onSubmit={expenseForm.handleSubmit(handleAddExpense)}>
                <DialogHeader>
                  <DialogTitle className="text-2xl">Anotar gasto</DialogTitle>
                  <DialogDescription>Ej: mercadería, proveedor, luz, compras del día</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   <FormField
                    control={expenseForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel className="text-base">Monto</FormLabel>
                        <FormControl>
                          <Input
                             {...field}
                             placeholder="Ej: 5000"
                             className="h-12 text-lg"
                             inputMode="numeric"
                             type="text"
                             value={formattedExpenseAmount}
                             onChange={e => {
                               const rawValue = e.target.value.replace(/[^\d]/g, '');
                               if (rawValue === '') {
                                 setFormattedExpenseAmount('');
                                 field.onChange(undefined);
                               } else {
                                 const numberValue = parseInt(rawValue, 10);
                                 if (!isNaN(numberValue)) {
                                   setFormattedExpenseAmount(new Intl.NumberFormat('es-CL').format(numberValue));
                                   field.onChange(numberValue);
                                 }
                               }
                             }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={expenseForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel className="text-base">Motivo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: Proveedor de bebidas" className="h-12 text-lg" value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit">Guardar Gasto</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <DailyCloseDialog 
          isOpen={isDailyCloseOpen}
          onOpenChange={setDailyCloseOpen}
          uid={user?.uid ?? ''}
          systemExpectedCash={summary.expectedCash}
          stats={{
            totalSales: summary.totalSales,
            totalExpenses: summary.totalExpenses,
            paymentMethods: summary.paymentMethods
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header userProfile={userProfile ?? null} />
      <main className="flex-grow w-full max-w-4xl mx-auto p-4 flex items-start justify-center">
        {renderContent()}
      </main>
    </div>
  );
}
