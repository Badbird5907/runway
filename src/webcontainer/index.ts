import { buildFileTree } from '@/fs/zen-fs';
import { bufferWatchEvents } from '@/util/buffer';
import { WebContainer } from '@webcontainer/api';
import { fs } from "@/fs"
import * as vscode from 'vscode';
import { URI } from 'vscode/vscode/vs/base/common/uri';

type WebContainerState = {
  status: "booting" | "ready" | "error"
  ports: number[]
  serverUrl: string | null
  lastPreviewMessage: string | null

  addPort: (port: number) => void
  removePort: (port: number) => void
  setServerUrl: (url: string | null) => void
  setLastPreviewMessage: (message: string | null) => void
}
// export const useWebContainerState = create<WebContainerState>()(
//   immer((set) => ({
//     status: "booting",
//     ports: [],
//     serverUrl: null,
//     lastPreviewMessage: null,

//     addPort: (port: number) => {
//       set(state => {
//         state.ports.push(port)
//       })
//     },
//     removePort: (port: number) => {
//       set(state => {
//         state.ports = state.ports.filter(p => p !== port)
//       })
//     },
//     setServerUrl: (url: string | null) => {
//       set(state => {
//         state.serverUrl = url
//       })
//     },
//     setLastPreviewMessage: (message: string | null) => {
//       set(state => {
//         state.lastPreviewMessage = message
//       })
//     }
//   }))
// )

let webContainerPromise: Promise<WebContainer> | null = null;

export const isWebContainerBooted = () => {
  return webContainerPromise !== null;
}

export const getWebContainer = async (): Promise<WebContainer> => {
  if (!webContainerPromise) {
    webContainerPromise = bootWebContainer();
  }
  return webContainerPromise;
}

export const bootWebContainer = async () => {
  console.log("booting webcontainer")
  vscode.window.setStatusBarMessage("Booting WebContainer...", 10000);
  const wc = await WebContainer.boot({ workdirName: "workspace" }).then((wc) => {
    console.log("webcontainer booted");
    vscode.window.setStatusBarMessage("WebContainer booted", 10000);
    return wc;
  }).catch((e) => {
    webContainerPromise = null; // Reset promise on error
    console.error("error booting webcontainer", e);
    vscode.window.setStatusBarMessage("Error booting WebContainer", 10000);
    vscode.window.showErrorMessage("Failed to boot WebContainer!!")
    throw e;
  });
  const files = await buildFileTree();
  console.log(files);
  console.log("webcontainer booted, mounting...");
  await wc.mount(files, { mountPoint: "/" });
  console.log("mounted");
  beginWebContainerFSSync(wc);
  return wc;
}

const FS_IGNORE_PATHS = ["**/node_modules", ".git"]
const beginWebContainerFSSync = (wc: WebContainer) => {
  wc.internal.watchPaths(
    { include: [`/home/workspace/**`], exclude: FS_IGNORE_PATHS, includeContent: true},
    bufferWatchEvents(100, async (events) => {
      const watchEvents = events.flat(2);
      for (const { type, path, buffer } of watchEvents) { // TODO: Clean up this code!!
        console.log(type, path, buffer);
        // remove trailing slash
        let sanitizedPath = path.replace(/\/+$/g, "");
        if (!sanitizedPath.startsWith("/home/workspace")) {
          continue;
        }
    
        let create = false;
        switch (type) {
          case "add_dir": {
            // propagate to zenfs
            const path = URI.file(sanitizedPath);
            console.log("adding dir", path);
            await fs?.mkdir(path);
            break;
          }
          case "remove_dir": {
            // propagate to zenfs
            await fs?.delete(URI.file(sanitizedPath), { recursive: true, useTrash: false, atomic: false })
            break;
          }
          case "add_file":
            create = true;
          case "change": {
            if (!buffer) {
              throw new Error("Buffer is undefined");
            }
            console.log(` -> Writing ${sanitizedPath} with size ${buffer.byteLength} bytes`);
            // propagate to zenfs, mark as webcontainer write so we don't infinite loop
            await fs?.writeFile(URI.file(sanitizedPath), buffer, { create, overwrite: true, unlock: true, atomic: false, webContainer: true });
            break;
          }
          case "remove_file": {
            console.log(` -> Removing ${sanitizedPath}`);
            await fs?.delete(URI.file(sanitizedPath), { recursive: false, useTrash: false, atomic: false })
            break;
          }
          case "update_directory": {
            break;
          }
        }
      }
    })
  )
}
