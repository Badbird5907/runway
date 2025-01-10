"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { PortListener, ServerReadyListener, PreviewMessageListener, ErrorListener, WebContainer, WebContainerProcess } from '@webcontainer/api';
import { files } from '@/app/app/files';

type WebContainerStatus = 'booting' | 'ready' | 'error';

// Add this new type mapping
type WebContainerEventMap = {
  // webcontainer listeners
  'port': PortListener;
  'server-ready': ServerReadyListener;
  'preview-message': PreviewMessageListener;
  'error': ErrorListener;

  // our listeners
  'shell-output': (data: string) => void;
};

// Add type for listener with ID
type ListenerEntry<T> = {
  id: string;
  callback: T;
};

type Listeners = {
  [key in keyof WebContainerEventMap]: ListenerEntry<WebContainerEventMap[key]>[];
};

export const WebContainerContext = createContext<{
  webContainer: WebContainer | null;
  status: WebContainerStatus;
  listeners: React.RefObject<Listeners>;
  shellProcess: WebContainerProcess | null;
  addListener: <T extends keyof WebContainerEventMap>(
    event: T,
    callback: WebContainerEventMap[T]
  ) => string;
  removeListener: (event: keyof WebContainerEventMap, id: string) => void;
} | null>(null);


export const WebContainerProvider = ({ children }: { children: React.ReactNode }) => {
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
  const listeners = useRef<Listeners>({
    'port': [],
    'server-ready': [],
    'preview-message': [],
    'error': [],
    'shell-output': [],
  });
  const status = useRef<WebContainerStatus>('booting');
  const [shellProcess, setShellProcess] = useState<WebContainerProcess | null>(null);

  useEffect(() => {
    if (status.current === 'booting') {
      status.current = 'ready';
      WebContainer.boot().then(async (instance) => {
        // instance.mount(files);
        setWebContainer(instance);
        instance.on('port', (port, type, url) => {
          listeners.current.port.forEach(({ callback }) => callback(port, type, url))
        });
        instance.on('server-ready', (port, url) => {
          listeners.current['server-ready'].forEach(({ callback }) => callback(port, url))
        });
        instance.on('preview-message', (message) => {
          listeners.current['preview-message'].forEach(({ callback }) => callback(message))
        });
        instance.on('error', (error) => {
          listeners.current['error'].forEach(({ callback }) => callback(error))
        });


        const shellProcess = await instance.spawn('jsh', {
          terminal: {
            cols: 80, // default for now
            rows: 12,
          },
        });
        setShellProcess(shellProcess);

        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              listeners.current['shell-output'].forEach(({ callback }) => callback(data))
            },
          })
        );
      });
    }
  }, []);

  // Add the addListener and removeListener functions
  const addListener = <T extends keyof WebContainerEventMap>(
    event: T,
    callback: WebContainerEventMap[T]
  ): string => {
    const id = crypto.randomUUID();
    listeners.current[event].push({ id, callback: callback });
    return id;
  };
  const removeListener = <T extends keyof WebContainerEventMap>(event: T, id: string) => {
    listeners.current[event] = listeners.current[event].filter(
      (listener) => listener.id !== id
    ) as Listeners[T];
  };

  return (
    <WebContainerContext.Provider value={{ 
      webContainer, 
      status: status.current, 
      listeners, 
      shellProcess,
      addListener,
      removeListener 
    }}>
      {children}
    </WebContainerContext.Provider>
  );
};

/**
 * Custom hook to access the WebContainer instance
 */
export const useWebContainer = () => {
  const context = useContext(WebContainerContext);
  if (!context) {
    throw new Error('useWebContainer must be used within a WebContainerProvider');
  }
  return {
    ...context,
    listeners: context.listeners.current,
  };
};


