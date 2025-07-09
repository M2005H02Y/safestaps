
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Cog, FileText, File } from "lucide-react";
import Image from "next/image";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", subLabel: "Vue d'ensemble", icon: LayoutGrid },
  { href: "/workstations", label: "Postes de Travail", subLabel: "Gestion des engines", icon: Cog },
  { href: "/standards", label: "Standards", subLabel: "Documents standards", icon: FileText },
  { href: "/forms", label: "Formulaires", subLabel: "Formulaires configurables", icon: File },
];

const logoUrl = 'https://i.postimg.cc/nzSLBHck/Logo.png';

export default function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
           <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1">
            <Image src={logoUrl} alt="WorkHub Central Logo" width={32} height={32} className="h-full w-full object-contain" />
          </div>
          {state === 'expanded' && (
            <div className="flex flex-col">
              <h1 className="text-base font-semibold text-white">WorkHub Central</h1>
              <p className="text-xs text-sidebar-foreground">Procédures & Sécurité</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarGroupLabel className="px-2 mb-1">Navigation</SidebarGroupLabel>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: "right" }}
                className="h-auto p-2"
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 shrink-0" />
                  <div className={cn("flex flex-col overflow-hidden transition-all duration-200", state === "collapsed" ? "w-0" : "w-full")}>
                    <span className="font-medium text-sm text-white">{item.label}</span>
                    <span className="text-xs text-sidebar-foreground">{item.subLabel}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
