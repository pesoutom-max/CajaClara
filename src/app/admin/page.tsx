"use client";

import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { format } from "date-fns";
import { Trash2, Ban, CheckCircle, KeyRound, UserPlus } from "lucide-react";

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "active" | "suspended";
    createdAt: unknown;
}

export default function AdminPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData: UserData[] = [];
            snapshot.forEach((doc) => {
                usersData.push({ id: doc.id, ...doc.data() } as UserData);
            });
            setUsers(usersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleUserStatus = async (user: UserData) => {
        const newStatus = user.status === "active" ? "suspended" : "active";
        if (confirm(`¿Estás seguro de que quieres cambiar el estado de ${user.name} a ${newStatus}?`)) {
            try {
                await updateDoc(doc(db, "users", user.id), { status: newStatus });
            } catch (error) {
                console.error(error);
                alert("Error al actualizar el estado");
            }
        }
    };

    const handleResetPassword = async (email: string) => {
        if (confirm(`¿Enviar correo de restablecimiento de contraseña a ${email}?`)) {
            try {
                await sendPasswordResetEmail(auth, email);
                alert("Correo de restablecimiento enviado.");
            } catch (error) {
                console.error(error);
                alert("Error al enviar el correo");
            }
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (confirm(`¿ATENCIÓN! ¿Estás seguro de que quieres eliminar a ${name}? Esto borrará su perfil (la cuenta en Authentication debe borrarse manualmente por seguridad en el cliente).`)) {
            try {
                await deleteDoc(doc(db, "users", id));
            } catch (error) {
                console.error(error);
                alert("Error al eliminar el usuario");
            }
        }
    };

    return (
        <AuthGuard requireAdmin>
            <div className="p-4 pt-6 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-primary">Panel Super Admin</h1>
                    <button
                        onClick={() => alert("Para crear usuarios sin cerrar la sesión actual, diles que se registren en la página de inicio o usa Firebase Admin SDK en el servidor.")}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-accent transition"
                    >
                        <UserPlus size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {users.map((u) => (
                            <div key={u.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                            {u.name}
                                            {u.role === "admin" && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase">Admin</span>}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{u.email}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Registrado: {(u.createdAt as { toDate?: () => Date })?.toDate ? format((u.createdAt as { toDate: () => Date }).toDate(), "dd/MM/yyyy") : 'N/A'}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-semibold ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {u.status === 'active' ? 'Activo' : 'Suspendido'}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => toggleUserStatus(u)}
                                        title={u.status === "active" ? "Suspender" : "Activar"}
                                        className="flex-1 flex justify-center items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {u.status === "active" ? <Ban size={16} /> : <CheckCircle size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleResetPassword(u.email)}
                                        title="Resetear Contraseña"
                                        className="flex-1 flex justify-center items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <KeyRound size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(u.id, u.name)}
                                        title="Eliminar Perfil"
                                        className="flex-1 flex justify-center items-center gap-2 p-2 text-sm text-expense hover:bg-red-50 rounded-lg transition-colors"
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
