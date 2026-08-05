import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Layers3,
  Landmark,
  Home,
  UserCheck,
  Users,
  BellRing,
  FileDown,
  ShieldCheck,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const monitoring = [
  { title: "Executive Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Block Monitoring", url: "/blocks", icon: Layers3 },
  { title: "Gram Panchayat", url: "/gram-panchayats", icon: Landmark },
  { title: "Village Monitoring", url: "/villages", icon: Home },
];

const operations = [
  { title: "Officer Performance", url: "/officers", icon: UserCheck },
  { title: "Beneficiaries", url: "/beneficiaries", icon: Users },
  { title: "Alerts & Escalation", url: "/alerts", icon: BellRing },
  { title: "Reports & Export", url: "/reports", icon: FileDown },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-3 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary">
            <ShieldCheck className="size-5 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-display text-sm font-semibold uppercase tracking-wide text-sidebar-foreground">
              Command Centre
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">Mahtari Vandan Yojana</p>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {monitoring.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operations.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3 group-data-[collapsible=icon]:hidden">
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent p-3">
            <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-sidebar-accent-foreground">District Collector</p>
            <p className="text-[11px] text-sidebar-foreground/60">Full district jurisdiction</p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
