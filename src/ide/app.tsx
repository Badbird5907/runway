import { WebContainerProvider } from "@/components/container";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import XTermConsole from "@/components/xterm-console";
import { IFrame } from "@/ide/iframe";
import { IDESidebar } from "@/ide/sidebar";
import { IDESidebarContent } from "@/ide/sidebar/content";

const App = () => {
  return (
    <WebContainerProvider>
      <SidebarProvider open={false}>
        <IDESidebar />
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20}>
            <IDESidebarContent />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <ResizablePanelGroup direction="vertical" className="h-full min-h-screen max-h-screen">
              <ResizablePanel>
                <IFrame />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <XTermConsole />
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarProvider>
    </WebContainerProvider>
  )
}
export default App;