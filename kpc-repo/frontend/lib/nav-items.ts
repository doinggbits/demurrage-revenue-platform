import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Truck,
  Map,
  FileText,
  ShieldCheck,
  Receipt,
  TrendingDown,
  Brain,
  Gavel,
  Workflow,
  FileBarChart,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  // Roles that can see this section. Omit to show to everyone signed in.
  roles?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/movements", label: "Truck movements", icon: Truck },
  { href: "/portal/yard-gis", label: "Yard & GIS", icon: Map, roles: ["Ops", "Admin", "Auditor"] },
  { href: "/portal/contracts", label: "Contracts (TSAs)", icon: FileText, roles: ["Billing Approver", "Finance", "Auditor", "Admin"] },
  { href: "/portal/compliance", label: "Compliance", icon: ShieldCheck, roles: ["Ops", "Auditor", "Admin"] },
  { href: "/portal/billing", label: "Billing & invoices", icon: Receipt },
  { href: "/portal/revenue-leakage", label: "Revenue leakage", icon: TrendingDown, roles: ["Billing Approver", "Finance", "Admin", "Auditor"] },
  { href: "/portal/ai-intelligence", label: "AI intelligence", icon: Brain, roles: ["Finance", "Ops", "Admin", "Auditor"] },
  { href: "/portal/disputes", label: "Disputes", icon: Gavel },
  { href: "/portal/etl-pipeline", label: "ETL pipeline", icon: Workflow, roles: ["Ops", "Admin"] },
  { href: "/portal/reports", label: "Reports & exports", icon: FileBarChart },
  { href: "/portal/about", label: "Developers & Team", icon: Users },
];

export function navItemsForRole(role: string): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
