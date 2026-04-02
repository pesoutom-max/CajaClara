"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Landmark, Wallet, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

const dailyCloseSchema = z.object({
  countedCash: z.coerce.number().min(0, "El monto debe ser positivo o cero."),
  withdrawal: z.coerce.number().min(0, "El monto debe ser positivo o cero."),
  withdrawalNote: z.string().optional(),
});

type DailyCloseValues = z.infer<typeof dailyCloseSchema>;

interface DailyCloseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  uid: string;
  systemExpectedCash: number;
  stats: {
    totalSales: number;
    totalExpenses: number;
    paymentMethods: {
      efectivo: number;
      debito: number;
      transferencia: number;
    };
  };
}

export function DailyCloseDialog({
  isOpen,
  onOpenChange,
  uid,
  systemExpectedCash,
  stats,
}: DailyCloseDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formattedCounted, setFormattedCounted] = useState("");
  const [formattedWithdrawal, setFormattedWithdrawal] = useState("");

  const form = useForm<DailyCloseValues>({
    resolver: zodResolver(dailyCloseSchema),
    defaultValues: {
      countedCash: 0,
      withdrawal: 0,
      withdrawalNote: "",
    },
  });

  const countedCash = form.watch("countedCash") || 0;
  const withdrawal = form.watch("withdrawal") || 0;
  const difference = countedCash - systemExpectedCash;
  const tomorrowBalance = countedCash - withdrawal;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(value);
  };

  const onSubmit = (values: DailyCloseValues) => {
    if (!uid) {
      toast({
        title: "Error de usuario",
        description: "No se pudo identificar al usuario activo.",
        variant: "destructive",
      });
      return;
    }

    const dailyClosesCollection = collection(firestore, "users", uid, "daily_closes");
    
    // Sanitize values to prevent Firestore crashes from NaN
    const payload = {
      date: serverTimestamp(),
      systemCash: Number(systemExpectedCash) || 0,
      countedCash: Number(values.countedCash) || 0,
      difference: (Number(values.countedCash) || 0) - (Number(systemExpectedCash) || 0),
      withdrawal: {
        amount: Number(values.withdrawal) || 0,
        note: (values.withdrawalNote || "").trim(),
      },
      tomorrowBalance: (Number(values.countedCash) || 0) - (Number(values.withdrawal) || 0),
      stats: {
        totalSales: Number(stats.totalSales) || 0,
        totalExpenses: Number(stats.totalExpenses) || 0,
        paymentMethods: {
          efectivo: Number(stats.paymentMethods.efectivo) || 0,
          debito: Number(stats.paymentMethods.debito) || 0,
          transferencia: Number(stats.paymentMethods.transferencia) || 0,
        }
      },
      timestamp: serverTimestamp(),
    };

    addDocumentNonBlocking(dailyClosesCollection, payload)
      .then((docRef) => {
        // If docRef is undefined but no error was thrown, addDocumentNonBlocking's catch might have swallowed a real error
        // But usually successful addDoc returns DocumentReference
        toast({
          title: "Cierre de caja guardado",
          description: "El cierre del día se ha registrado correctamente.",
        });
        onOpenChange(false);
        form.reset();
        setFormattedCounted("");
        setFormattedWithdrawal("");
      })
      .catch((error) => {
        console.error("Error saving daily close:", error);
        toast({
          title: "Error al guardar",
          description: "Hubo un problema al registrar el cierre en la base de datos.",
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Cierre de Caja Diario</DialogTitle>
          <DialogDescription>
            Cuadra tu efectivo y registra los retiros antes de terminar el día.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Resumen del Sistema */}
            <div className="bg-secondary/30 p-4 rounded-xl space-y-2 border border-border">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Efectivo esperado (en sistema)</span>
                <span className="font-semibold text-foreground">{formatCurrency(systemExpectedCash)}</span>
              </div>
            </div>

            {/* Arqueo de Caja */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="countedCash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base flex items-center gap-2">
                       <Wallet className="h-4 w-4 text-primary" /> ¿Cuánto efectivo hay en realidad?
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Monto contado físicamente"
                        className="h-12 text-lg font-bold"
                        inputMode="numeric"
                        value={formattedCounted}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, "");
                          if (val === "") {
                            setFormattedCounted("");
                            field.onChange(0);
                          } else {
                            const num = parseInt(val, 10);
                            setFormattedCounted(new Intl.NumberFormat("es-CL").format(num));
                            field.onChange(num);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Visualización de Diferencia */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                difference === 0 ? "bg-positive/10 border-positive/30 text-positive" : 
                difference > 0 ? "bg-blue-500/10 border-blue-500/30 text-blue-600" : 
                "bg-negative/10 border-negative/30 text-negative"
              }`}>
                {difference === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <div className="text-sm">
                  <p className="font-bold">
                    {difference === 0 ? "Caja cuadrada" : 
                     difference > 0 ? `Sobrante: ${formatCurrency(difference)}` : 
                     `Faltante: ${formatCurrency(Math.abs(difference))}`}
                  </p>
                  <p className="opacity-80 text-xs">Comparado con lo esperado por el sistema.</p>
                </div>
              </div>
            </div>

            {/* Retiro de Efectivo */}
            <div className="space-y-4 pt-4 border-t">
              <FormField
                control={form.control}
                name="withdrawal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base flex items-center gap-2">
                       <Landmark className="h-4 w-4 text-primary" /> Monto a Retirar de Caja
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Depósito al banco"
                        className="h-12 text-lg"
                        inputMode="numeric"
                        value={formattedWithdrawal}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, "");
                          if (val === "") {
                            setFormattedWithdrawal("");
                            field.onChange(0);
                          } else {
                            const num = parseInt(val, 10);
                            setFormattedWithdrawal(new Intl.NumberFormat("es-CL").format(num));
                            field.onChange(num);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="withdrawalNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nota del retiro (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Para pago de arriendo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Saldo para Mañana */}
            <div className="bg-primary/5 p-4 rounded-xl border-2 border-primary/20 flex justify-between items-center">
              <div>
                <p className="text-sm text-primary font-bold uppercase tracking-wider">Saldo para Mañana</p>
                <p className="text-xs text-muted-foreground">Efectivo que se queda en la caja física.</p>
              </div>
              <div className="text-2xl font-bold font-headline text-primary">
                {formatCurrency(tomorrowBalance)}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button type="submit" className="flex-1 sm:flex-none">
                Confirmar y Cerrar Caja
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
