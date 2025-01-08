"use client";

import { createContext, useEffect, useState } from "react";
import { WebContainer } from "@webcontainer/api";

export const WebContainerContext = createContext<WebContainer | null>(null);

export const WebContainerProvider = ({ children }: { children: React.ReactNode }) => {
  const [container, setContainer] = useState<WebContainer | null>(null);

  useEffect(() => {
    const initContainer = async () => {
      if (!container) {
        const newContainer = await WebContainer.boot();
        setContainer(newContainer);
      }
    };
    initContainer();
  }, [container]);

  return <WebContainerContext.Provider value={container}>{children}</WebContainerContext.Provider>;
}
