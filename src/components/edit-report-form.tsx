'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { DailyClose } from './reportes-list';
import { collection, doc, getDocs, writeBatch, query, where, updateDoc } from 'firebase/firestore';
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Button } from "@/components/ui/button";
import { formatCurrency, getNum } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Banknote,
    PackageMinus,
    Wallet,
    CreditCard,
    ArrowRightLeft,
    Gift,
    Bike,
    School2,
    Calendar as CalendarIcon,
    Save,
    Loader2,
    ArrowDownCircle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface EditReportFormProps {
    report: DailyClose;
    onFinished: () => void;
}

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
    cashWithdrawal: string;
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
    cashWithdrawal: "",
};

export function EditReportForm({ report, onFinished }: EditReportFormProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [date, setDate] = useState<Date | undefined>(new Date(report.date.seconds * 1000));
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [sales, setSales] = useState<SalesData>(initialSalesData);
    const [isSaving, setIsSaving] = useState(false);
    const [expectedCash, setExpectedCash] = useState(0);

    const deliverySalesQuery = useMemoFirebase(
        () => (firestore ? collection(firestore, 'daily_closes', report.id, 'delivery_service_sales') : null),
        [firestore, report.id]
    );
    const { data: deliverySales, isLoading: isLoadingDelivery } = useCollection<{ serviceName: string, salesAmount: number }>(deliverySalesQuery);

    const handleInputChange = (field: keyof SalesData, value: string) => {
        const digits = value.replace(/\D/g, "");
        if (!digits) {
            setSales((prev) => ({ ...prev, [field]: "" }));
            return;
        }
        const numberValue = parseInt(digits, 10);
        const formattedValue = new Intl.NumberFormat('es-CL').format(numberValue);
        setSales((prev) => ({ ...prev, [field]: formattedValue }));
    };

    useEffect(() => {
        if (isLoadingDelivery) return;

        const newSales: SalesData = {
            saldoAnterior: String(report.startingCashBalance),
            efectivo: String(report.totalCashSales),
            tarjetas: String(report.totalCardSales),
            transferencias: String(report.totalTransferSales),
            giftCards: String(report.totalGiftCardSales),
            gastosEfectivo: String(report.cashExpenses),
            cashWithdrawal: String(report.cashWithdrawal || 0),
            pedidosYaIceScroll: '0',
            pedidosYaWafix: '0',
            pedidosYaMixie: '0',
            pedidosYaChurroBlis: '0',
            uberEats: '0',
            junaeb: '0',
        };

        if (deliverySales) {
            deliverySales.forEach(sale => {
                if (sale.serviceName === "Pedidos Ya Ice Scroll") newSales.pedidosYaIceScroll = String(sale.salesAmount);
                if (sale.serviceName === "Pedidos Ya Wafix") newSales.pedidosYaWafix = String(sale.salesAmount);
                if (sale.serviceName === "Pedidos Ya Mix" || sale.serviceName === "Pedidos Ya Mixie") newSales.pedidosYaMixie = String(sale.salesAmount);
                if (sale.serviceName === "Pedidos Ya Churro Blis") newSales.pedidosYaChurroBlis = String(sale.salesAmount);
                if (sale.serviceName === "Uber Eats") newSales.uberEats = String(sale.salesAmount);
                if (sale.serviceName === "Junaeb") newSales.junaeb = String(sale.salesAmount);
            });
        }

        // This is a bit of a hack to set the state and then format it
        // A better way would be to have raw and formatted state separately
        Object.entries(newSales).forEach(([key, value]) => {
            handleInputChange(key as keyof SalesData, value);
        });

    }, [report, deliverySales, isLoadingDelivery]);


    useEffect(() => {
        const { saldoAnterior, efectivo, gastosEfectivo } = sales;
        const cashBalance = getNum(saldoAnterior) + getNum(efectivo) - getNum(gastosEfectivo);
        setExpectedCash(cashBalance);
    }, [sales]);

    const handleUpdate = async () => {
        if (!firestore) return;
        setIsSaving(true);

        try {
            const batch = writeBatch(firestore);
            const reportRef = doc(firestore, 'daily_closes', report.id);

            const deliverySalesData: { [key: string]: number } = {
                "Pedidos Ya Ice Scroll": getNum(sales.pedidosYaIceScroll),
                "Pedidos Ya Wafix": getNum(sales.pedidosYaWafix),
                "Pedidos Ya Mixie": getNum(sales.pedidosYaMixie),
                "Pedidos Ya Churro Blis": getNum(sales.pedidosYaChurroBlis),
                "Uber Eats": getNum(sales.uberEats),
                "Junaeb": getNum(sales.junaeb),
            };

            const totalDeliverySales = Object.values(deliverySalesData).reduce((sum, v) => sum + v, 0);

            const updatedDailyClose: any = {
                date: date,
                startingCashBalance: getNum(sales.saldoAnterior),
                totalCashSales: getNum(sales.efectivo),
                totalCardSales: getNum(sales.tarjetas),
                totalTransferSales: getNum(sales.transferencias),
                totalGiftCardSales: getNum(sales.giftCards),
                cashExpenses: getNum(sales.gastosEfectivo),
                totalDeliverySales,
                expectedCashBalance: expectedCash,
                cashWithdrawal: getNum(sales.cashWithdrawal),
                nextDayBalance: (report.totalCashInBox || 0) - getNum(sales.cashWithdrawal),
            };

            if (report.totalCashInBox !== undefined) {
                updatedDailyClose.cashDifference = report.totalCashInBox - expectedCash;
            }

            batch.update(reportRef, updatedDailyClose);

            const deliverySalesRef = collection(reportRef, 'delivery_service_sales');
            const existingDeliverySalesSnapshot = await getDocs(deliverySalesRef);

            existingDeliverySalesSnapshot.forEach(doc => batch.delete(doc.ref));

            for (const [serviceName, salesAmount] of Object.entries(deliverySalesData)) {
                if (salesAmount > 0) {
                    const newSaleRef = doc(collection(reportRef, 'delivery_service_sales'));
                    batch.set(newSaleRef, { dailyCloseId: report.id, serviceName, salesAmount });
                }
            }

            await batch.commit();
            toast({ title: 'Reporte Actualizado', description: 'El reporte ha sido modificado con éxito.' });
            onFinished();

        } catch (error: any) {
            console.error("Error updating report: ", error);
            toast({
                variant: "destructive",
                title: "Error al actualizar",
                description: error.message || "No se pudo actualizar el reporte.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingDelivery) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate() }} className="space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <Card>
                    <CardHeader><CardTitle>Caja y Gastos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <InputWithIcon label="Saldo Anterior" icon={<Banknote className="w-4 h-4" />} value={sales.saldoAnterior} onChange={(e) => handleInputChange("saldoAnterior", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Gastos en Efectivo" icon={<PackageMinus className="w-4 h-4" />} value={sales.gastosEfectivo} onChange={(e) => handleInputChange("gastosEfectivo", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Retiro de Efectivo" icon={<ArrowDownCircle className="w-4 h-4 text-destructive" />} value={sales.cashWithdrawal} onChange={(e) => handleInputChange("cashWithdrawal", e.target.value)} placeholder="0" inputMode="numeric" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Ingresos Principales</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <InputWithIcon label="Efectivo" icon={<Wallet className="w-4 h-4" />} value={sales.efectivo} onChange={(e) => handleInputChange("efectivo", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Tarjetas" icon={<CreditCard className="w-4 h-4" />} value={sales.tarjetas} onChange={(e) => handleInputChange("tarjetas", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Transferencias" icon={<ArrowRightLeft className="w-4 h-4" />} value={sales.transferencias} onChange={(e) => handleInputChange("transferencias", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Gift Cards" icon={<Gift className="w-4 h-4" />} value={sales.giftCards} onChange={(e) => handleInputChange("giftCards", e.target.value)} placeholder="0" inputMode="numeric" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Ingresos por Delivery</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <InputWithIcon label="Pedidos Ya Ice" icon={<Bike className="w-4 h-4" />} value={sales.pedidosYaIceScroll} onChange={(e) => handleInputChange("pedidosYaIceScroll", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Pedidos Ya Wafix" icon={<Bike className="w-4 h-4" />} value={sales.pedidosYaWafix} onChange={(e) => handleInputChange("pedidosYaWafix", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Pedidos Ya Mixie" icon={<Bike className="w-4 h-4" />} value={sales.pedidosYaMixie} onChange={(e) => handleInputChange("pedidosYaMixie", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Pedidos Ya Churro Blis" icon={<Bike className="w-4 h-4" />} value={sales.pedidosYaChurroBlis} onChange={(e) => handleInputChange("pedidosYaChurroBlis", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Uber Eats" icon={<Bike className="w-4 h-4" />} value={sales.uberEats} onChange={(e) => handleInputChange("uberEats", e.target.value)} placeholder="0" inputMode="numeric" />
                        <InputWithIcon label="Junaeb" icon={<School2 className="w-4 h-4" />} value={sales.junaeb} onChange={(e) => handleInputChange("junaeb", e.target.value)} placeholder="0" inputMode="numeric" />
                    </CardContent>
                </Card>
            </div>
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between sm:items-center">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className="w-full sm:w-[280px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d || new Date()); setIsCalendarOpen(false); }} initialFocus />
                    </PopoverContent>
                </Popover>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={onFinished}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>
        </form>
    );
}
