"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Button } from "@/components/ui/button";
import { formatCurrency, getNum } from "@/lib/utils";
import {
  Banknote,
  PackageMinus,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  Gift,
  Bike,
  School2,
  Sigma,
  PiggyBank,
  RotateCcw,
  Coins,
  AlertTriangle,
  Calendar as CalendarIcon,
  Share,
  Download,
  Save,
  Loader2,
  Landmark,
  ArrowDownCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";

interface SalesData {
  saldoAnterior: string;
  gastosEfectivo: string;
  efectivo: string;
  tarjetas: string;
  transferencias: string;
  giftCards: string;
  pedidosYaIceScroll: string;
  pedidosYaWafix: string;
  pedidosYaMixie: string;
  pedidosYaChurroBlis: string;
  uberEats: string;
  junaeb: string;
}

const initialSalesData: SalesData = {
  saldoAnterior: "",
  gastosEfectivo: "",
  efectivo: "",
  tarjetas: "",
  transferencias: "",
  giftCards: "",
  pedidosYaIceScroll: "",
  pedidosYaWafix: "",
  pedidosYaMixie: "",
  pedidosYaChurroBlis: "",
  uberEats: "",
  junaeb: "",
};


interface CashBreakdown {
  b20000: number;
  b10000: number;
  b5000: number;
  b2000: number;
  b1000: number;
  m500: number;
  m100: number;
  m50: number;
}

const initialCashBreakdown: CashBreakdown = {
  b20000: 0,
  b10000: 0,
  b5000: 0,
  b2000: 0,
  b1000: 0,
  m500: 0,
  m100: 0,
  m50: 0,
};

const denominations = [
  { label: "Billetes de $20.000", value: 20000, key: "b20000" as keyof CashBreakdown },
  { label: "Billetes de $10.000", value: 10000, key: "b10000" as keyof CashBreakdown },
  { label: "Billetes de $5.000", value: 5000, key: "b5000" as keyof CashBreakdown },
  { label: "Billetes de $2.000", value: 2000, key: "b2000" as keyof CashBreakdown },
  { label: "Billetes de $1.000", value: 1000, key: "b1000" as keyof CashBreakdown },
  { label: "Monedas de $500", value: 500, key: "m500" as keyof CashBreakdown },
  { label: "Monedas de $100", value: 100, key: "m100" as keyof CashBreakdown },
  { label: "Monedas de $50", value: 50, key: "m50" as keyof CashBreakdown },
];


export default function CajaForm() {
  const [date, setDate] = React.useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [sales, setSales] = React.useState<SalesData>(initialSalesData);
  const [cashBreakdown, setCashBreakdown] = React.useState<CashBreakdown>(initialCashBreakdown);
  const [cashWithdrawal, setCashWithdrawal] = React.useState("");

  const [totalSales, setTotalSales] = React.useState(0);
  const [expectedCash, setExpectedCash] = React.useState(0);
  const [totalCashInBox, setTotalCashInBox] = React.useState(0);
  const [difference, setDifference] = React.useState(0);
  const [nextDayBalance, setNextDayBalance] = React.useState(0);


  const [isCalculating, setIsCalculating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();

  React.useEffect(() => {
    // Set date only on client to avoid hydration mismatch.
    setDate(new Date());
  }, []);

  const handleInputChange = (field: keyof SalesData, value: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const start = input.selectionStart || 0;
    const oldLength = input.value.length;

    const digits = value.replace(/\D/g, "");

    if (!digits) {
      setSales((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    const numberValue = parseInt(digits, 10);
    const formattedValue = new Intl.NumberFormat('es-CL').format(numberValue);

    setSales((prev) => ({ ...prev, [field]: formattedValue }));

    // Restore cursor position
    setTimeout(() => {
      const newLength = formattedValue.length;
      const lengthDiff = newLength - oldLength;
      const newPos = Math.max(0, start + lengthDiff);
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleCashWithdrawalChange = (value: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const start = input.selectionStart || 0;
    const oldLength = input.value.length;

    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setCashWithdrawal("");
      return;
    }
    const numberValue = parseInt(digits, 10);
    const formattedValue = new Intl.NumberFormat('es-CL').format(numberValue);
    setCashWithdrawal(formattedValue);

    // Restore cursor position
    setTimeout(() => {
      const newLength = formattedValue.length;
      const lengthDiff = newLength - oldLength;
      const newPos = Math.max(0, start + lengthDiff);
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };


  const handleBreakdownChange = (field: keyof CashBreakdown, value: string) => {
    const numericValue = parseInt(value, 10);
    setCashBreakdown((prev) => ({
      ...prev,
      [field]: isNaN(numericValue) ? 0 : numericValue,
    }));
  };

  const resetForm = () => {
    setSales(initialSalesData);
    setCashBreakdown(initialCashBreakdown);
    setCashWithdrawal("");
    setDate(new Date());
    toast({
      title: "Formulario reiniciado",
      description: "Todos los campos han sido limpiados.",
    });
  }

  React.useEffect(() => {
    setIsCalculating(true);

    const {
      efectivo, tarjetas, transferencias, giftCards,
      pedidosYaIceScroll, pedidosYaWafix, pedidosYaMixie, pedidosYaChurroBlis,
      uberEats, junaeb
    } = sales;

    const total =
      getNum(efectivo) + getNum(tarjetas) + getNum(transferencias) + getNum(giftCards) +
      getNum(pedidosYaIceScroll) + getNum(pedidosYaWafix) + getNum(pedidosYaMixie) + getNum(pedidosYaChurroBlis) +
      getNum(uberEats) + getNum(junaeb);
    setTotalSales(total);

    const { saldoAnterior, gastosEfectivo } = sales;
    const cashBalance = getNum(saldoAnterior) + getNum(efectivo) - getNum(gastosEfectivo);
    setExpectedCash(cashBalance);

    const timer = setTimeout(() => setIsCalculating(false), 300);
    return () => clearTimeout(timer);
  }, [sales]);

  React.useEffect(() => {
    const total = denominations.reduce((acc, d) => {
      return acc + (cashBreakdown[d.key] || 0) * d.value;
    }, 0);
    setTotalCashInBox(total);
  }, [cashBreakdown]);

  React.useEffect(() => {
    setDifference(totalCashInBox - expectedCash);
  }, [totalCashInBox, expectedCash]);

  React.useEffect(() => {
    setNextDayBalance(totalCashInBox - getNum(cashWithdrawal));
  }, [totalCashInBox, cashWithdrawal]);

  const getDifferenceColor = () => {
    if (difference < 0) return 'text-destructive dark:text-red-400';
    if (difference > 0) return 'text-primary dark:text-emerald-400';
    return 'text-muted-foreground';
  };

  const getReportData = () => {
    const numericSales = Object.fromEntries(
      Object.entries(sales).map(([key, value]) => [key, getNum(value)])
    ) as { [K in keyof SalesData]: number };

    return {
      reportDate: date || new Date(),
      sales: numericSales,
      cashBreakdown,
      totalSales,
      expectedCash,
      totalCashInBox,
      difference,
      cashWithdrawal: getNum(cashWithdrawal),
      nextDayBalance,
    };
  };

  const handleSave = () => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar a Firebase. Inténtalo de nuevo.",
      });
      return;
    }

    setIsSaving(true);

    const deliverySalesData: { [key: string]: number } = {
      "Pedidos Ya Ice Scroll": getNum(sales.pedidosYaIceScroll),
      "Pedidos Ya Wafix": getNum(sales.pedidosYaWafix),
      "Pedidos Ya Mixie": getNum(sales.pedidosYaMixie),
      "Pedidos Ya Churro Blis": getNum(sales.pedidosYaChurroBlis),
      "Uber Eats": getNum(sales.uberEats),
      "Junaeb": getNum(sales.junaeb),
    };

    const totalDeliverySales = Object.values(deliverySalesData).reduce((sum, v) => sum + v, 0);

    const dailyCloseSchemaData = {
      date: date || new Date(),
      startingCashBalance: getNum(sales.saldoAnterior),
      totalCashSales: getNum(sales.efectivo),
      totalCardSales: getNum(sales.tarjetas),
      totalTransferSales: getNum(sales.transferencias),
      totalGiftCardSales: getNum(sales.giftCards),
      totalDeliverySales: totalDeliverySales,
      cashExpenses: getNum(sales.gastosEfectivo),
      expectedCashBalance: expectedCash,
      totalCashInBox: totalCashInBox,
      cashDifference: difference,
      cashWithdrawal: getNum(cashWithdrawal),
      nextDayBalance: nextDayBalance,
    };

    const mainCollectionRef = collection(firestore, "daily_closes");

    addDocumentNonBlocking(mainCollectionRef, dailyCloseSchemaData)
      .then(dailyCloseRef => {
        if (!dailyCloseRef) {
          throw new Error("Failed to create daily close document.");
        }

        const deliveryServicePromises = Object.entries(deliverySalesData)
          .filter(([_, salesAmount]) => salesAmount > 0)
          .map(([serviceName, salesAmount]) => {
            const deliverySaleData = {
              dailyCloseId: dailyCloseRef.id,
              serviceName: serviceName,
              salesAmount: salesAmount,
            };
            const subCollectionRef = collection(doc(mainCollectionRef, dailyCloseRef.id), 'delivery_service_sales');
            return addDocumentNonBlocking(subCollectionRef, deliverySaleData);
          });

        return Promise.all(deliveryServicePromises);
      })
      .then(results => {
        if (results.some(r => r === undefined)) {
          throw new Error("Failed to save some delivery service sales.");
        }
        toast({
          title: "Reporte Guardado",
          description: `El reporte del ${format(date || new Date(), "PPP", { locale: es })} ha sido guardado con éxito.`,
        });
        resetForm();
      })
      .catch((error) => {
        console.error("Error saving document: ", error);
        toast({
          variant: "destructive",
          title: "Error al guardar",
          description: error.message || "No se pudo guardar el reporte. Revisa la consola para más detalles.",
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const reportData = getReportData();

    doc.setFontSize(20);
    doc.text("Reporte de Cierre de Caja", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Fecha: ${format(reportData.reportDate, "PPP", { locale: es })}`, 105, 28, { align: 'center' });

    autoTable(doc, {
      startY: 40,
      head: [['Resumen', 'Monto']],
      body: [
        ['Venta Total del Día', formatCurrency(reportData.totalSales)],
        ['Saldo Esperado en Caja', formatCurrency(reportData.expectedCash)],
        ['Efectivo Real en Caja', formatCurrency(reportData.totalCashInBox)],
        ['Diferencia', { content: formatCurrency(reportData.difference), styles: { textColor: reportData.difference < 0 ? [255, 0, 0] : [0, 0, 0] } }],
        ['Retiro de Efectivo', formatCurrency(reportData.cashWithdrawal)],
        ['Saldo Día Siguiente', formatCurrency(reportData.nextDayBalance)],
      ],
      theme: 'grid',
    });

    const lastTableY = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: lastTableY + 10,
      head: [['Concepto de Ingreso', 'Monto']],
      body: [
        ['Efectivo del Día', formatCurrency(reportData.sales.efectivo)],
        ['Monto en Tarjetas', formatCurrency(reportData.sales.tarjetas)],
        ['Transferencias Recibidas', formatCurrency(reportData.sales.transferencias)],
        ['Gift Cards Entregados', formatCurrency(reportData.sales.giftCards)],
        ['Pedidos Ya Ice Scroll', formatCurrency(reportData.sales.pedidosYaIceScroll)],
        ['Pedidos Ya Wafix', formatCurrency(reportData.sales.pedidosYaWafix)],
        ['Pedidos Ya Mixie', formatCurrency(reportData.sales.pedidosYaMixie)],
        ['Pedidos Ya Churro Blis', formatCurrency(reportData.sales.pedidosYaChurroBlis)],
        ['Uber Eats', formatCurrency(reportData.sales.uberEats)],
        ['Junaeb', formatCurrency(reportData.sales.junaeb)],
        ['Saldo Anterior en Caja', formatCurrency(reportData.sales.saldoAnterior)],
        ['Gastos en Efectivo', formatCurrency(reportData.sales.gastosEfectivo)],
      ],
      theme: 'striped',
    });

    const secondTableY = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: secondTableY + 10,
      head: [['Denominación', 'Cantidad', 'Total']],
      body: denominations.map(d => [
        d.label,
        reportData.cashBreakdown[d.key] || '0',
        formatCurrency((reportData.cashBreakdown[d.key] || 0) * d.value)
      ]),
      didDrawPage: (data) => {
        data.settings.margin.top = 10;
      },
      theme: 'grid',
    });


    doc.save(`Reporte_Caja_${format(reportData.reportDate, "yyyy-MM-dd")}.pdf`);
  };

  const shareViaWhatsApp = () => {
    const reportData = getReportData();
    const totalDelivery =
      reportData.sales.pedidosYaIceScroll +
      reportData.sales.pedidosYaWafix +
      reportData.sales.pedidosYaMixie +
      reportData.sales.pedidosYaChurroBlis +
      reportData.sales.uberEats +
      reportData.sales.junaeb;

    const message = `*Resumen de Caja - ${format(reportData.reportDate, "PPP", { locale: es })}*

*Resumen General:*
- Venta Total: ${formatCurrency(reportData.totalSales)}
- Saldo Esperado: ${formatCurrency(reportData.expectedCash)}
- Efectivo Real: ${formatCurrency(reportData.totalCashInBox)}
- *Diferencia: ${formatCurrency(reportData.difference)}*
- Retiro: ${formatCurrency(reportData.cashWithdrawal)}
- *Saldo para Mañana: ${formatCurrency(reportData.nextDayBalance)}*

*Desglose de Ingresos:*
- Efectivo: ${formatCurrency(reportData.sales.efectivo)}
- Tarjetas: ${formatCurrency(reportData.sales.tarjetas)}
- Transferencias: ${formatCurrency(reportData.sales.transferencias)}
- Gift Cards: ${formatCurrency(reportData.sales.giftCards)}
- Delivery: ${formatCurrency(totalDelivery)}

Saludos.`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <CardTitle>Resumen del Día</CardTitle>
                <CardDescription>Totales calculados en base a los datos ingresados.</CardDescription>
              </div>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full md:w-[280px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 p-6 rounded-lg bg-primary/10 border-2 border-dashed border-primary transition-all duration-300 ${isCalculating ? 'border-accent shadow-lg shadow-accent/20' : 'border-primary'}`}>
              <SummaryItem
                icon={<Sigma className="w-10 h-10 text-accent" />}
                label="Venta Total del Día"
                value={totalSales}
              />
              <SummaryItem
                icon={<Landmark className="w-10 h-10 text-accent" />}
                label="Saldo Esperado en Caja"
                value={expectedCash}
              />
              <SummaryItem
                icon={<Coins className="w-10 h-10 text-accent" />}
                label="Efectivo Real en Caja"
                value={totalCashInBox}
              />
              <SummaryItem
                icon={<AlertTriangle className={`w-10 h-10 transition-colors duration-300 ${getDifferenceColor()}`} />}
                label="Diferencia"
                value={difference}
                valueClassName={getDifferenceColor()}
              />
              <SummaryItem
                icon={<PiggyBank className="w-10 h-10 text-accent" />}
                label="Saldo Día Siguiente"
                value={nextDayBalance}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Caja y Gastos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputWithIcon
              label="Saldo Anterior en Caja"
              icon={<Banknote className="w-4 h-4" />}
              value={sales.saldoAnterior}
              onChange={(e) => handleInputChange("saldoAnterior", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
            <InputWithIcon
              label="Gastos en Efectivo"
              icon={<PackageMinus className="w-4 h-4" />}
              value={sales.gastosEfectivo}
              onChange={(e) => handleInputChange("gastosEfectivo", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos Principales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputWithIcon
              label="Efectivo del Día"
              icon={<Wallet className="w-4 h-4" />}
              value={sales.efectivo}
              onChange={(e) => handleInputChange("efectivo", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
            <InputWithIcon
              label="Monto en Tarjetas"
              icon={<CreditCard className="w-4 h-4" />}
              value={sales.tarjetas}
              onChange={(e) => handleInputChange("tarjetas", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
            <InputWithIcon
              label="Transferencias Recibidas"
              icon={<ArrowRightLeft className="w-4 h-4" />}
              value={sales.transferencias}
              onChange={(e) => handleInputChange("transferencias", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
            <InputWithIcon
              label="Gift Cards Entregados"
              icon={<Gift className="w-4 h-4" />}
              value={sales.giftCards}
              onChange={(e) => handleInputChange("giftCards", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InputWithIcon
              label="Pedidos Ya Ice Scroll"
              icon={<Bike className="w-4 h-4" />}
              value={sales.pedidosYaIceScroll}
              onChange={(e) => handleInputChange("pedidosYaIceScroll", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
            <InputWithIcon
              label="Pedidos Ya Wafix"
              icon={<Bike className="w-4 h-4" />}
              value={sales.pedidosYaWafix}
              onChange={(e) => handleInputChange("pedidosYaWafix", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
            <InputWithIcon
              label="Pedidos Ya Mixie"
              icon={<Bike className="w-4 h-4" />}
              value={sales.pedidosYaMixie}
              onChange={(e) => handleInputChange("pedidosYaMixie", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
            <InputWithIcon
              label="Pedidos Ya Churro Blis"
              icon={<Bike className="w-4 h-4" />}
              value={sales.pedidosYaChurroBlis}
              onChange={(e) => handleInputChange("pedidosYaChurroBlis", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
            <InputWithIcon
              label="Uber Eats"
              icon={<Bike className="w-4 h-4" />}
              value={sales.uberEats}
              onChange={(e) => handleInputChange("uberEats", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
            <InputWithIcon
              label="Junaeb"
              icon={<School2 className="w-4 h-4" />}
              value={sales.junaeb}
              onChange={(e) => handleInputChange("junaeb", e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle de Efectivo en Caja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {denominations.map((d) => (
              <div key={d.key} className="flex items-center justify-between gap-2">
                <Label htmlFor={d.key} className="text-sm font-normal flex-1">{d.label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={d.key}
                    type="number"
                    value={cashBreakdown[d.key] || ''}
                    onChange={(e) => handleBreakdownChange(d.key, e.target.value)}
                    placeholder="0"
                    className="w-16 h-9 text-right"
                    min="0"
                    step="1"
                  />
                  <span className="w-20 text-right font-mono text-sm text-muted-foreground">
                    {formatCurrency((cashBreakdown[d.key] || 0) * d.value)}
                  </span>
                </div>
              </div>
            ))}
            <Separator className="my-4" />
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total Contado</span>
              <span>{formatCurrency(totalCashInBox)}</span>
            </div>
            <InputWithIcon
              label="Retiro de Efectivo"
              icon={<ArrowDownCircle className="w-4 h-4 text-destructive" />}
              value={cashWithdrawal}
              onChange={(e) => handleCashWithdrawalChange(e.target.value, e)}
              placeholder="0"
              inputMode="numeric"
              containerClassName="pt-4"
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-4 flex flex-col sm:flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={resetForm}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
          <Button type="button" variant="secondary" onClick={shareViaWhatsApp}>
            <Share className="mr-2 h-4 w-4" />
            Compartir
          </Button>
          <Button type="button" variant="secondary" onClick={generatePDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </div>
      </div>
    </form>
  );
}

function SummaryItem({ icon, label, value, valueClassName = "text-accent" }: { icon: React.ReactNode, label: string, value: number, valueClassName?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4"
    >
      {icon}
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={value}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className={`text-2xl sm:text-3xl font-bold transition-all duration-300 ${valueClassName}`}
          >
            {formatCurrency(value)}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
