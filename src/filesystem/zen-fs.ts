import { FSNode, useFileSystem } from "@/filesystem";
import { bufferWatchEvents } from "@/lib/utils/buffer";
import { DirectoryNode, FileNode, FileSystemTree, SymlinkNode, WebContainer } from "@webcontainer/api";
import { configure, fs as zenFs } from "@zenfs/core";
import { IndexedDB } from '@zenfs/dom';
import { getEncoding } from 'istextorbinary';

// const utf8TextDecoder = new TextDecoder('utf8', { fatal: true });
class ZenFileSystemHandler {
  constructor() {}

  async init()  {
    await configure({
      mounts: {
        "/": IndexedDB
      }
    })
    zenFs.writeFileSync("/test.txt", "Hello World");
  }

  async mountWebContainer(webContainer: WebContainer) {
    const files: FileSystemTree = {};
    const editorFiles: { [key: string]: FSNode } = {};

    const setFiles = useFileSystem.getState().setFiles;
    
    // Helper function to recursively build the file tree
    const buildTree = async (path: string): Promise<{ result: DirectoryNode | FileNode | SymlinkNode, editorState: FSNode }> => {
      const stats = zenFs.statSync(path);
      
      if (stats.isSymbolicLink()) {
        const target = zenFs.readlinkSync(path).toString('utf-8');
        return {
          result: {
            file: {
              symlink: target
            }
          },
          editorState: {
            symlink: {
              target
            }
          }
        };
      }
        
      if (stats.isFile()) {
        const buff = zenFs.readFileSync(path);
        return {
          result: {
            file: {
              contents: buff
            }
          },
          editorState: {
            file: {
              size: stats.size,
              isBinary: isBinaryFile(buff)
            }
          }
        };
      }
        
      if (stats.isDirectory()) {
        const entries = zenFs.readdirSync(path);
        const webContainerTree: FileSystemTree = {};
        const editorTree: { [key: string]: FSNode } = {};
        
        const buildPromises = entries.map(async (entry) => {
          const fullPath = path === '/' ? `/${entry}` : `${path}/${entry}`;
          const { result, editorState } = await buildTree(fullPath);
          return { entry, result, editorState };
        });

        const results = await Promise.all(buildPromises);
        
        for (const { entry, result, editorState } of results) {
          webContainerTree[entry] = result;
          editorTree[entry] = editorState;
        }
        
        return {
          result: { directory: webContainerTree },
          editorState: { directory: editorTree, open: false } // TODO: maybe persist this? Would be slow...
        };
      }
      
      throw new Error(`Unsupported file type at path: ${path}`);
    };

    const dirs = zenFs.readdirSync("/"); // TODO: implement projects by instead reading from /<project>/*
    const buildPromises = dirs.map(async (dir) => {
      const { result, editorState } = await buildTree(`/${dir}`);
      return { dir, result, editorState };
    });

    const results = await Promise.all(buildPromises);
    
    for (const { dir, result, editorState } of results) {
      files[dir] = result;
      editorFiles[dir] = editorState;
    }

    console.log({ files, editorFiles });

    setFiles(editorFiles);
    
    await webContainer.mount(files, { mountPoint: "/" });
    console.log("mounted, watching paths...");
    webContainer.internal.watchPaths(
      { include: [`/home/workspace/**`], exclude: ["**/node_modules", ".git"], includeContent: true},
      bufferWatchEvents(100, (events) => {
        const watchEvents = events.flat(2);
        for (const { type, path, buffer } of watchEvents) { // TODO: Clean up this code!!
          console.log(type, path, buffer);
          // remove trailing slash
          let sanitizedPath = path.replace(/\/+$/g, "");
          if (!sanitizedPath.startsWith("/home/workspace")) {
            continue;
          }
          // remove leading /home/workspace
          sanitizedPath = sanitizedPath.substring("/home/workspace".length);
      
          switch (type) {
            case "add_dir": {
              // propagate to zenfs
              zenFs.mkdirSync(sanitizedPath);
              
              // update editor state
              let current = editorFiles;
              const parts = sanitizedPath.split('/').filter(Boolean);
              for (let i = 0; i < parts.length - 1; i++) {
                current = (current[parts[i]] as { directory: typeof current }).directory;
              }
              current[parts[parts.length - 1]] = { directory: {}, open: false };
              
              useFileSystem.getState().setFiles(editorFiles);
              break;
            }
            case "remove_dir": {
              // propagate to zenfs
              console.log(" -> removing", sanitizedPath);
              try {
                zenFs.rmSync(sanitizedPath, { recursive: true, force: true }); // TODO: https://github.com/zen-fs/core/issues/99 ??
              } catch (error) {
                console.log(" -> error removing", sanitizedPath, error);
              }
              // it works.. but it doesn't remove the base directory, so we do it again
              try {
                zenFs.rmdirSync(sanitizedPath);
              } catch (error) {
                console.log(" -> error removing (kind of expected)", sanitizedPath, error); // WHAT THE FUCKK
              }
              console.log(" -> removed", sanitizedPath);
              
              // update editor state
              let current = editorFiles;
              const parts = sanitizedPath.split('/').filter(Boolean);
              for (let i = 0; i < parts.length - 1; i++) {
                current = (current[parts[i]] as { directory: typeof current }).directory;
              }
              delete current[parts[parts.length - 1]];
          
              useFileSystem.getState().setFiles(editorFiles);
              break;
            }
            case "add_file":
            case "change": {
              if (!buffer) {
                throw new Error("Buffer is undefined");
              }
              const isBinary = isBinaryFile(buffer);
              console.log(` -> Writing ${sanitizedPath} with size ${buffer.byteLength} bytes`);
              // propagate to zenfs
              zenFs.writeFileSync(sanitizedPath, buffer);
              // update editor state

              let current = editorFiles;
              const parts = sanitizedPath.split('/').filter(Boolean);
              for (let i = 0; i < parts.length - 1; i++) {
                current = (current[parts[i]] as { directory: typeof current }).directory;
              }
              current[parts[parts.length - 1]] = {
                file: {
                  size: buffer.byteLength,
                  isBinary
                }
              };

              useFileSystem.getState().setFiles(editorFiles);
              break;
            }
            case "remove_file": {
              console.log(` -> Removing ${sanitizedPath}`);
              
              zenFs.unlinkSync(sanitizedPath);
              
              let current = editorFiles;
              const parts = sanitizedPath.split('/').filter(Boolean);
              for (let i = 0; i < parts.length - 1; i++) {
                current = (current[parts[i]] as { directory: typeof current }).directory;
              }
              delete current[parts[parts.length - 1]];
              // update editor state
              useFileSystem.getState().setFiles(editorFiles);
              break;
            }
            case "update_directory": {
              break;
            }
          }
          console.log(useFileSystem.getState().files);
        }
      })
    )
  }
}
export const fileSystem = new ZenFileSystemHandler();

function isBinaryFile(buffer: Uint8Array | undefined) {
  if (buffer === undefined) {
    return false;
  }

  return getEncoding(convertToBuffer(buffer), { chunkLength: 100 }) === 'binary';
}
function convertToBuffer(view: Uint8Array): Buffer {
  return Buffer.from(view.buffer, view.byteOffset, view.byteLength);
}
// function decodeFileContent(buffer?: Uint8Array) {
//   if (!buffer || buffer.byteLength === 0) {
//     return '';
//   }

//   try {
//     return utf8TextDecoder.decode(buffer);
//   } catch (error) {
//     console.log(error);
//     return '';
//   }
// }
