"use client";

import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState, useMemo } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";

interface Transaction {
    id: string;
    type: "ingreso" | "gasto";
    amount: number;
    category: string;
    description: string;
    date: number;
}

const COLORS = ["#1a7a7a", "#2a9d9d", "#3bbfbf", "#4cdbdb", "#e53e3e", "#f56565", "#fc8181", "#fed7d7"];

export default function DashboardPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Time references
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    useEffect(() => {
        if (!user) return;

        // Fetch all transactions to calculate 6-month historical data and current month
        // In a huge app, you'd fetch only the required time range. For a small business app, fetching all or last 12 months is okay.
        // For simplicity, we fetch all and filter in memory.
        const q = query(collection(db, `users/${user.uid}/transactions`));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const transData: Transaction[] = [];
            snapshot.forEach((doc) => {
                transData.push({ id: doc.id, ...doc.data() } as Transaction);
            });
            setTransactions(transData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Calculations
    const { currentMonthIngresos, currentMonthGastos, balance, barChartData, pieChartData } = useMemo(() => {
        if (!transactions.length) return {
            currentMonthIngresos: 0, currentMonthGastos: 0, balance: 0, barChartData: [], pieChartData: []
        };

        let ingresos = 0;
        let gastos = 0;
        const expenseCategories: Record<string, number> = {};

        // For Bar Chart (last 6 months)
        const monthsData: Record<string, { name: string, ingresos: number, gastos: number }> = {};
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(now, i);
            const key = format(d, "yyyy-MM");
            monthsData[key] = {
                name: format(d, "MMM", { locale: es }),
                ingresos: 0,
                gastos: 0
            };
        }

        transactions.forEach(t => {
            const tDate = new Date(t.date);

            // Current Month Summary
            if (isWithinInterval(tDate, { start: currentMonthStart, end: currentMonthEnd })) {
                if (t.type === "ingreso") {
                    ingresos += t.amount;
                } else {
                    gastos += t.amount;
                    expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
                }
            }

            // Bar Chart Summary
            const monthKey = format(tDate, "yyyy-MM");
            if (monthsData[monthKey]) {
                if (t.type === "ingreso") {
                    monthsData[monthKey].ingresos += t.amount;
                } else {
                    monthsData[monthKey].gastos += t.amount;
                }
            }
        });

        const pieData = Object.keys(expenseCategories).map(key => ({
            name: key,
            value: expenseCategories[key]
        })).sort((a, b) => b.value - a.value); // Sort descending

        return {
            currentMonthIngresos: ingresos,
            currentMonthGastos: gastos,
            balance: ingresos - gastos,
            barChartData: Object.values(monthsData),
            pieChartData: pieData
        };
    }, [transactions, currentMonthStart, currentMonthEnd, now]);

    if (loading) {
        return (
            <AuthGuard>
                <div className="flex justify-center items-center h-screen bg-gray-50">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="p-4 pt-6 bg-gray-50 min-h-[calc(100vh-60px)] pb-24 overflow-y-auto">
                <header className="mb-6">
                    <h1 className="text-xl font-bold text-gray-800 capitalize">
                        {format(now, "MMMM yyyy", { locale: es })}
                    </h1>
                    <p className="text-sm text-gray-500">Resumen financiero</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-2">
                        <h3 className="text-sm text-gray-500 font-medium mb-1">Balance del mes</h3>
                        <p className={`text-3xl font-bold ${balance >= 0 ? "text-primary" : "text-expense"}`}>
                            {balance >= 0 ? "" : "-"}${Math.abs(balance).toLocaleString("es-CL")}
                        </p>
                    </div>

                    <div className="bg-income/10 p-4 rounded-xl border border-income/20">
                        <h3 className="text-xs text-income font-semibold uppercase mb-1">Ingresos</h3>
                        <p className="text-lg font-bold text-income">${currentMonthIngresos.toLocaleString("es-CL")}</p>
                    </div>

                    <div className="bg-expense/10 p-4 rounded-xl border border-expense/20">
                        <h3 className="text-xs text-expense font-semibold uppercase mb-1">Gastos</h3>
                        <p className="text-lg font-bold text-expense">${currentMonthGastos.toLocaleString("es-CL")}</p>
                    </div>
                </div>

                {/* Bar Chart: Last 6 Months */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Ingresos vs Gastos (6 meses)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val / 1000}k`} axisLine={false} tickLine={false} />
                                <RechartsTooltip formatter={(value: number | string | undefined) => `$${Number(value || 0).toLocaleString("es-CL")}`} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#2a9d9d" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="gastos" name="Gastos" fill="#e53e3e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Expenses by Category */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Gastos por Categoría (Este mes)</h3>
                    {pieChartData.length > 0 ? (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number | string | undefined) => `$${Number(value || 0).toLocaleString("es-CL")}`} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-10">No hay gastos registrados este mes.</p>
                    )}
                </div>

            </div>
        </AuthGuard>
    );
}
