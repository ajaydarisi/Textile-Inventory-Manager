"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Database,
  Settings,
  LogOut,
  Package,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { CompanyProvider } from "@/contexts/company-context";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon: Icon, label, href, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
        )}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
    </Link>
  );
}

function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 z-20">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
              T
            </div>
            <span className="font-semibold text-sidebar-foreground tracking-tight">
              TexLedger
            </span>
          </div>
        </div>

        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            href="/dashboard"
            active={pathname === "/dashboard"}
          />

          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Accounting
          </div>
          <SidebarItem
            icon={FileText}
            label="Vouchers"
            href="/vouchers/purchase"
            active={pathname.startsWith("/vouchers")}
          />
          <SidebarItem
            icon={BookOpen}
            label="Reports"
            href="/reports/stock"
            active={pathname.startsWith("/reports")}
          />

          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Inventory
          </div>
          <SidebarItem
            icon={Package}
            label="Stock Summary"
            href="/reports/stock"
            active={pathname === "/reports/stock"}
          />

          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Setup
          </div>
          <SidebarItem
            icon={Database}
            label="Masters"
            href="/masters/ledgers"
            active={pathname.startsWith("/masters")}
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            href="/masters/company"
            active={pathname === "/masters/company"}
          />
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
              {profile?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email || ""}
              </p>
            </div>
            <button
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CompanyProvider>
        <AppSidebar>{children}</AppSidebar>
      </CompanyProvider>
    </AuthProvider>
  );
}
