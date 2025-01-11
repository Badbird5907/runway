"use client";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenuButton } from "@/components/ui/sidebar"
import { pages, useIDERouter } from "@/ide/router"
import { cn } from "@/lib/utils"

export const IDESidebar = () => {
  const router = useIDERouter();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup className="flex flex-col gap-4">
          {Object.entries(pages).map(([key, page]) => {
            if (page.bottom) return null;
            return (
              <SidebarMenuButton asChild key={key} className={cn(
                "scale-150 hover:cursor-pointer border-l-2 rounded-none",
                router.page === key ? "border-active" : "border-transparent"
              )} onClick={() => router.setPage(key)}>
                <page.icon size={96} />
              </SidebarMenuButton>
            )
          })}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {Object.entries(pages).map(([key, page]) => {
          if (!page.bottom) return null;
          return (
            <SidebarMenuButton asChild key={key} className={cn(
              "scale-150 hover:cursor-pointer border-l-2 rounded-none",
              router.page === key ? "border-active" : "border-transparent"
            )} onClick={() => router.setPage(key)}>
              <page.icon size={96} />
            </SidebarMenuButton>
          )
        })}
      </SidebarFooter>
    </Sidebar>
  )
}