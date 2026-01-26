"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MinusCircle, PlusCircle, Info } from 'lucide-react';

interface Summary {
  totalSales: number;
  totalExpenses: number;
  cashInHand: number;
}

interface DashboardClientProps {
  summary: Summary;
}

export function DashboardClient({ summary }: DashboardClientProps) {
  const [isSaleOpen, setSaleOpen] = useState(false);
  const [isExpenseOpen, setExpenseOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Así va tu día</CardTitle>
          <CardDescription>Resumen de hoy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <span className="text-2xl font-bold">{formatCurrency(summary.cashInHand)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button size="lg" className="h-16 text-lg" onClick={() => setSaleOpen(true)}>
          <PlusCircle className="mr-2 h-6 w-6" /> Sumar venta
        </Button>
        <Button size="lg" variant="secondary" className="h-16 text-lg" onClick={() => setExpenseOpen(true)}>
          <MinusCircle className="mr-2 h-6 w-6" /> Anotar gasto
        </Button>
      </div>
      
      <div className="text-center text-muted-foreground p-4 mt-4 border-t">
        <Info className="inline-block mr-2" />
        <p className="inline">Con esto ya sabes cómo te fue hoy. <br/> <strong>No necesitas sumar nada.</strong></p>
      </div>

      {/* Dialogs */}
      <Dialog open={isSaleOpen} onOpenChange={setSaleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Sumar venta</DialogTitle>
            <DialogDescription>Anota una nueva venta de forma rápida y sencilla.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sale-amount" className="text-base">Monto</Label>
              <Input id="sale-amount" type="number" placeholder="Ej: 1500" className="h-12 text-lg" />
            </div>
            <div className="grid gap-2">
              <Label className="text-base">Medio de pago</Label>
              <RadioGroup defaultValue="efectivo" className="flex gap-4">
                <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                  <RadioGroupItem value="efectivo" id="r1" /> Efectivo
                </Label>
                <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                  <RadioGroupItem value="debito" id="r2" /> Débito
                </Label>
                <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                  <RadioGroupItem value="transferencia" id="r3" /> Transf.
                </Label>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit" onClick={() => setSaleOpen(false)}>Guardar Venta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isExpenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Anotar gasto</DialogTitle>
            <DialogDescription>Ej: mercadería, proveedor, luz, compras del día</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="expense-amount" className="text-base">Monto</Label>
              <Input id="expense-amount" type="number" placeholder="Ej: 5000" className="h-12 text-lg" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expense-reason" className="text-base">Motivo</Label>
              <Input id="expense-reason" placeholder="Ej: Proveedor de bebidas" className="h-12 text-lg" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit" onClick={() => setExpenseOpen(false)}>Guardar Gasto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
