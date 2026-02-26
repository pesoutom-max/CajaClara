"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace("/login");
            } else if (requireAdmin && role !== "admin") {
                router.replace("/dashboard");
            } else if (pathname === "/login") {
                router.replace(role === "admin" ? "/admin" : "/dashboard");
            }
        }
    }, [user, role, loading, router, requireAdmin, pathname]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || (requireAdmin && role !== "admin")) {
        return null; // Will redirect in useEffect
    }

    return <>{children}</>;
}
