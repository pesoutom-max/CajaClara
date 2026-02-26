"use client";

import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ArrowDownRight, ArrowUpRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Transaction {
    id: string;
    type: "ingreso" | "gasto";
    amount: number;
    category: string;
    description: string;
    date: number;
}

export default function TransactionsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, `users/${user.uid}/transactions`),
            orderBy("date", "desc")
        );

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

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (confirm("¿Estás seguro de que quieres eliminar esta transacción?")) {
            try {
                await deleteDoc(doc(db, `users/${user.uid}/transactions`, id));
            } catch (error) {
                console.error("Error deleting transaction: ", error);
                alert("Hubo un error al eliminar.");
            }
        }
    };

    return (
        <AuthGuard>
            <div className="p-4 pt-6 bg-gray-50 min-h-screen">
                <h1 className="text-2xl font-bold text-primary mb-6">Mis Transacciones</h1>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <p>No tienes transacciones aún.</p>
                        <p className="text-sm">Usa el botón + para agregar una.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {transactions.map((t) => (
                            <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${t.type === 'ingreso' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                                        {t.type === 'ingreso' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-sm">{t.category}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {format(new Date(t.date), "d MMM yyyy", { locale: es })}
                                            {t.description && ` • ${t.description}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`font-bold text-sm ${t.type === 'ingreso' ? 'text-income' : 'text-expense'}`}>
                                        {t.type === 'ingreso' ? '+' : '-'}${t.amount.toLocaleString("es-CL")}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="p-1.5 text-gray-400 hover:text-expense hover:bg-expense/10 rounded-md transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}
