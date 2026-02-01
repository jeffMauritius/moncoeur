"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Heart,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Landmark,
  Users,
  Settings,
  Video,
  QrCode,
  FileSpreadsheet,
} from "lucide-react";

interface SidebarProps {
  userRole: "admin" | "seller";
}

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard, roles: ["admin", "seller"] },
  { name: "Stock", href: "/stock", icon: Package, roles: ["admin", "seller"] },
  { name: "Ventes", href: "/sales", icon: ShoppingCart, roles: ["admin", "seller"] },
  { name: "Scanner QR", href: "/stock/scan", icon: QrCode, roles: ["admin", "seller"] },
  { name: "Video Chat", href: "/video-chat", icon: Video, roles: ["admin", "seller"] },
  { name: "Comptes bancaires", href: "/bank-accounts", icon: Landmark, roles: ["admin"] },
  { name: "Utilisateurs", href: "/users", icon: Users, roles: ["admin"] },
  { name: "Import Excel", href: "/import", icon: FileSpreadsheet, roles: ["admin"] },
  { name: "Parametres", href: "/settings", icon: Settings, roles: ["admin", "seller"] },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-white border-r">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold text-primary">MonCoeur</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          MonCoeur v1.0.0
        </p>
      </div>
    </div>
  );
}
