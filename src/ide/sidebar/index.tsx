"use client";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenuButton } from "@/components/ui/sidebar"
import { AllPages, Page, pages, useIDERouter } from "@/ide/router"
import { cn } from "@/lib/utils"
import { memo } from "react";

const SidebarButton = memo(({ page, setPage, toPage, currentPage }: { page: Page, setPage: (page: AllPages) => void, toPage: AllPages, currentPage: AllPages }) => {
  return (
    <div className={cn(
      "h-12 w-12 border-l-2 rounded-none flex items-center justify-center",
      currentPage === toPage ? "border-l-active" : "border-l-transparent"
    )}>
      <button onClick={() => setPage(toPage)} className={cn(
        currentPage === toPage ? "text-white" : "text-muted-foreground hover:text-white"
      )}>
        <page.icon size={24} />
      </button>
    </div>
  )
})
SidebarButton.displayName = "SidebarButton";
export const IDESidebar = () => {
  const router = useIDERouter();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup className="flex flex-col p-0 py-2 h-full">
          {Object.entries(pages).map(([key, page]) => {
            if (page.bottom) return null;
            return (
              <SidebarButton key={key} page={page} setPage={router.setPage} toPage={key as AllPages} currentPage={router.page} />
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
            )} onClick={() => router.setPage(key as AllPages)}>
              <page.icon size={96} />
            </SidebarMenuButton>
          )
        })}
      </SidebarFooter>
    </Sidebar>
  )
}