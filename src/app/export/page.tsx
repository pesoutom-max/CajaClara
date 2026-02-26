"use client";

import AuthGuard from "@/components/AuthGuard";
import { useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface Transaction {
    id: string;
    type: "ingreso" | "gasto";
    amount: number;
    category: string;
    description: string;
    date: number;
}

export default function ExportPage() {
    const { user } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
    const [loading, setLoading] = useState(false);

    const fetchTransactions = async (): Promise<Transaction[]> => {
        if (!user) return [];

        // Convert selected YYYY-MM to exact ms range
        const [yearStr, monthStr] = selectedMonth.split("-");
        const dateQuery = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
        const start = startOfMonth(dateQuery).getTime();
        const end = endOfMonth(dateQuery).getTime();

        // Fetch all for simplicity, or we could query where date >= start and <= end.
        // Client side filter is okay for small scale.
        const q = query(collection(db, `users/${user.uid}/transactions`));
        const snapshot = await getDocs(q);

        const trans: Transaction[] = [];
        snapshot.forEach(doc => {
            trans.push({ id: doc.id, ...doc.data() } as Transaction);
        });

        // Filter by selected month and sort descending
        return trans
            .filter(t => t.date >= start && t.date <= end)
            .sort((a, b) => b.date - a.date);
    };

    const handleExportExcel = async () => {
        setLoading(true);
        try {
            const trans = await fetchTransactions();
            if (trans.length === 0) {
                alert("No hay transacciones en este mes.");
                return;
            }

            const worksheetData = trans.map(t => ({
                Fecha: format(new Date(t.date), "dd/MM/yyyy"),
                Tipo: t.type === "ingreso" ? "Ingreso" : "Gasto",
                Categoría: t.category,
                Descripción: t.description || "",
                Monto: t.amount // Let Excel handle number formatting or we can pass as string
            }));

            const ws = XLSX.utils.json_to_sheet(worksheetData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transacciones");
            XLSX.writeFile(wb, `CajaClara_${selectedMonth}.xlsx`);
        } catch (e) {
            console.error(e);
            alert("Error al exportar Excel");
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        setLoading(true);
        try {
            const trans = await fetchTransactions();
            if (trans.length === 0) {
                alert("No hay transacciones en este mes.");
                return;
            }

            const pdf = new jsPDF();
            pdf.setFontSize(18);
            pdf.text(`Reporte Financiero CajaClara`, 14, 22);

            pdf.setFontSize(12);
            pdf.text(`Mes: ${selectedMonth}`, 14, 30);

            // Calc Balance Summary
            let ingresos = 0;
            let gastos = 0;
            trans.forEach(t => {
                if (t.type === "ingreso") ingresos += t.amount;
                else gastos += t.amount;
            });
            const balance = ingresos - gastos;

            pdf.text(`Ingresos Totales: $${ingresos.toLocaleString("es-CL")}`, 14, 40);
            pdf.text(`Gastos Totales: $${gastos.toLocaleString("es-CL")}`, 14, 48);
            pdf.text(`Balance Final: $${balance.toLocaleString("es-CL")}`, 14, 56);

            const tableData = trans.map(t => [
                format(new Date(t.date), "dd/MM/yyyy"),
                t.type === "ingreso" ? "Ingreso" : "Gasto",
                t.category,
                t.description || "-",
                `$${t.amount.toLocaleString("es-CL")}`
            ]);

            // Typescript complains about autoTable not being on jsPDF instance natively.
            // Easiest is to bypass type checking here.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            pdf.autoTable({
                startY: 65,
                head: [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [26, 122, 122] } // Primary color #1a7a7a
            });

            pdf.save(`CajaClara_${selectedMonth}.pdf`);
        } catch (e) {
            console.error(e);
            alert("Error al exportar PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard>
            <div className="p-4 pt-6 bg-gray-50 min-h-screen">
                <h1 className="text-2xl font-bold text-primary mb-6">Exportar Datos</h1>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona el mes a exportar</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-primary"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleExportExcel}
                            disabled={loading}
                            className="flex items-center justify-center gap-3 w-full bg-[#107c41] hover:bg-[#0c5c30] text-white font-semibold rounded-lg p-4 transition-colors disabled:opacity-50"
                        >
                            <FileSpreadsheet size={24} />
                            Descargar Excel (.xlsx)
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={loading}
                            className="flex items-center justify-center gap-3 w-full bg-expense hover:bg-red-700 text-white font-semibold rounded-lg p-4 transition-colors disabled:opacity-50"
                        >
                            <FileText size={24} />
                            Descargar PDF
                        </button>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
