import AppSidebar from "@/components/app-sidebar";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="print-hidden">
        <AppSidebar />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
