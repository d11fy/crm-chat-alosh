"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  HelpCircle,
  Brain
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "لوحة التحكم",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "العملاء والمحادثات",
      href: "/customers",
      icon: Users,
    },
    {
      name: "المساعد الإداري الذكي",
      href: "/assistant",
      icon: MessageSquare,
    },
    {
      name: "تدريب الذكاء الاصطناعي",
      href: "/training",
      icon: Brain,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <TrendingUp size={28} className="text-primary" style={{ color: "var(--primary)" }} />
        <span>علوش ستور <span>CRM</span></span>
      </div>

      <nav style={{ flexGrow: 1 }}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          <HelpCircle size={16} />
          <span>نسخة النظام v1.1.0</span>
        </div>
      </div>
    </aside>
  );
}
