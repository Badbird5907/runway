"use client";

import { useWebContainer } from "@/components/container";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import XTermConsole from "@/components/xterm-console";
import { useEffect, useState } from "react";
export default function App() {
  const { webContainer, addListener, removeListener } = useWebContainer();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  async function startDevServer() {
    if (!webContainer) {
      return;
    }
    const installProcess = await webContainer.spawn('npm', ['install']);

    const installExitCode = await installProcess.exit;
  
    if (installExitCode !== 0) {
      throw new Error('Unable to run npm install: ' + installExitCode);
    }
  
    // `npm run dev`
    await webContainer.spawn('npm', ['run', 'dev']);
  }

  useEffect(() => {
    const serverReadyListenerId = addListener('server-ready', (port, url) => {
      console.log('server-ready', port, url);
      setIframeSrc(url);
    });
    return () => {
      removeListener('server-ready', serverReadyListenerId);
    };
  }, [addListener, removeListener]);

  if (!webContainer) {
    return <div>Loading WebContainer...</div>;
  }


  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel>
            <button onClick={startDevServer}>Start Dev Server</button>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            {iframeSrc && <iframe src={iframeSrc} />}
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <XTermConsole />
    </ResizablePanelGroup>
  )
}