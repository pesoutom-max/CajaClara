"use client";

import Link from "next/link";
import { Home, List, Download } from "lucide-react";
import { usePathname } from "next/navigation";

export default function BottomNav() {
    const pathname = usePathname();

    // Hide bottom nav on login or admin routes
    if (pathname === "/login" || pathname.startsWith("/admin")) {
        return null;
    }

    const tabs = [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "Transacciones", href: "/transactions", icon: List },
        { name: "Exportar", href: "/export", icon: Download },
    ];

    return (
        <nav className="fixed bottom-0 w-full max-w-[375px] bg-white border-t border-gray-200 z-50">
            <div className="flex justify-around items-center h-[60px]">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`flex flex-col items-center justify-center w-full h-full min-h-[44px] ${isActive ? "text-primary" : "text-gray-500"
                                }`}
                        >
                            <Icon size={24} className="mb-1" />
                            <span className="text-[10px] font-medium">{tab.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
