"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                router.push("/dashboard"); // AuthContext will handle role based next steps if needed, or we just push to dashboard and dashboard handles it.
                // Actually, if admin, they should go to /admin. We can rely on AuthGuard for that, or check here.
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create user doc in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    name,
                    email,
                    role: "user",
                    status: "active",
                    createdAt: serverTimestamp(),
                });

                router.push("/dashboard");
            }
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error de autenticación");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white pb-20">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-primary mb-2">FacilPyme</h1>
                    <h2 className="text-xl font-medium text-gray-600">CajaClara</h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && <div className="text-expense text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-primary"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-primary"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-primary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-semibold rounded-lg p-3 mt-4 hover:bg-accent transition-colors disabled:opacity-50"
                    >
                        {loading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Registrarse"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-primary text-sm hover:underline"
                    >
                        {isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
                    </button>
                </div>
            </div>
        </div>
    );
}
