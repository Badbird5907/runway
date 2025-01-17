import { useWebContainer } from "@/components/container";
import { useState } from "react";

import { useEffect } from "react";

export const IFrame = () => {
  console.log('IFrame');
  
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
      {iframeSrc ? <iframe src={iframeSrc} /> : (
        <div>
          <h1>No dev server detected yet</h1>
        </div>
      )}
    </>
  )
}