import { useWebContainer } from "@/components/container";
import { useState } from "react";

import { useEffect } from "react";

export const IFrame = () => {
  const { webContainer, addListener, removeListener } = useWebContainer();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

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
    <>
      {iframeSrc ? <iframe src={iframeSrc} className="w-full h-full" /> : (
        <div className="w-full h-full flex items-center justify-center">
          <h1>No dev server detected yet</h1>
        </div>
      )}
    </>
  )
}