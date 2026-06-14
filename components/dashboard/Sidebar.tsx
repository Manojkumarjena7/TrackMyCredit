"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  Heart,
  Download,
  CreditCard,
} from "lucide-react";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Upload Statement",
    href: "/dashboard/upload",
    icon: Upload,
  },
  {
    label: "Statements",
    href: "/dashboard/statements",
    icon: FileText,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Debt Growth",
    href: "/dashboard/debt",
    icon: TrendingUp,
  },
  {
    label: "Financial Health",
    href: "/dashboard/health",
    icon: Heart,
  },
  {
    label: "Export",
    href: "/dashboard/export",
    icon: Download,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm leading-tight">
            Credit
            <br />
            Intelligence
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 py-2 text-2xs font-semibold text-gray-400 uppercase tracking-widest">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                size={17}
                className={cn(
                  "flex-shrink-0",
                  isActive ? "text-brand-600" : "text-gray-400"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 text-2xs text-gray-400">
          Phase 1 — Authentication
        </div>
      </div>
    </aside>
  );
}
