"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = {
    ingreso: ["Venta al contado", "Transferencia", "Otro ingreso"],
    gasto: [
        "Proveedor",
        "Arriendo",
        "Servicios básicos",
        "Remuneraciones",
        "Marketing",
        "Transporte",
        "Otro gasto"
    ]
};

export default function FAB() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useAuth();

    // Form State
    const [type, setType] = useState<"ingreso" | "gasto">("ingreso");
    const [amountStr, setAmountStr] = useState("");
    const [category, setCategory] = useState(CATEGORIES["ingreso"][0]);
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Hide on login and admin
    if (pathname === "/login" || pathname.startsWith("/admin")) {
        return null;
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-digits
        const val = e.target.value.replace(/\D/g, "");
        if (!val) {
            setAmountStr("");
            return;
        }
        // Format with dots
        const formatted = parseInt(val, 10).toLocaleString("es-CL");
        setAmountStr(formatted);
    };

    const handleTypeChange = (newType: "ingreso" | "gasto") => {
        setType(newType);
        setCategory(CATEGORIES[newType][0]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !amountStr) return;

        setLoading(true);
        const amountNum = parseInt(amountStr.replace(/\./g, ""), 10);

        try {
            await addDoc(collection(db, `users/${user.uid}/transactions`), {
                type,
                amount: amountNum,
                category,
                description,
                date: new Date(date).getTime(), // Store as ms timestamp for easier sorting/filtering
                createdAt: serverTimestamp(),
            });

            // Reset and close
            setAmountStr("");
            setDescription("");
            setIsOpen(false);
            // Optional: trigger a refresh or let real-time listeners handle updates
        } catch (error) {
            console.error("Error adding transaction: ", error);
            alert("Error al guardar la transacción.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-[80px] right-4 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-accent transition-colors z-40 transform active:scale-95"
            >
                <Plus size={32} />
            </button>

            {/* Bottom Sheet Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-center items-end bg-black/50 transition-opacity">
                    <div className="w-full max-w-[375px] bg-white rounded-t-2xl p-6 min-h-[60vh] animate-slide-up overflow-y-auto pb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-primary">Nueva Transacción</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-800 p-1"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Type Toggle */}
                            <div className="flex rounded-lg overflow-hidden border border-gray-300">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 font-medium transition-colors ${type === "ingreso" ? "bg-income text-white" : "bg-gray-100 text-gray-600"
                                        }`}
                                    onClick={() => handleTypeChange("ingreso")}
                                >
                                    Ingreso
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 font-medium transition-colors ${type === "gasto" ? "bg-expense text-white" : "bg-gray-100 text-gray-600"
                                        }`}
                                    onClick={() => handleTypeChange("gasto")}
                                >
                                    Gasto
                                </button>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="text"
                                        required
                                        inputMode="numeric"
                                        value={amountStr}
                                        onChange={handleAmountChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 pl-8 outline-none focus:border-primary text-lg font-semibold"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-primary bg-white"
                                >
                                    {CATEGORIES[type].map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-primary"
                                    placeholder="Ej: Venta de producto X"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-primary"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !amountStr}
                                className="w-full bg-primary text-white font-semibold rounded-lg p-4 mt-4 hover:bg-accent transition-colors disabled:opacity-50"
                            >
                                {loading ? "Guardando..." : "Guardar Transacción"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
