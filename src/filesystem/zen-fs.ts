import { FSNode, useFileSystem } from "@/filesystem";
import { bufferWatchEvents } from "@/lib/utils/buffer";
import { getEncoding } from "@/lib/utils/istextorbinary";
import { DirectoryNode, FileNode, FileSystemTree, SymlinkNode, WebContainer } from "@webcontainer/api";
import { configure, fs as zenFs } from "@zenfs/core";
import { IndexedDB } from '@zenfs/dom';

// const utf8TextDecoder = new TextDecoder('utf8', { fatal: true });
class ZenFileSystemHandler {
  constructor() {}

  initial: {
    files: FileSystemTree;
    editorFiles: { [key: string]: FSNode };
  } = {
    files: {},
    editorFiles: {}
  };

  async init()  {
    await configure({
      mounts: {
        "/": IndexedDB
      }
    })
    zenFs.writeFileSync("/test.txt", "Hello World");

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
      this.initial.files[dir] = result;
      this.initial.editorFiles[dir] = editorState;
    }

    console.log({ files: this.initial.files, editorFiles: this.initial.editorFiles });

    setFiles(this.initial.editorFiles);
  }

  async mountWebContainer(webContainer: WebContainer) {
    await webContainer.mount(this.initial.files, { mountPoint: "/" });
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
              let current = this.initial.editorFiles;
              const parts = sanitizedPath.split('/').filter(Boolean);
              for (let i = 0; i < parts.length - 1; i++) {
                current = (current[parts[i]] as { directory: typeof current }).directory;
              }
              current[parts[parts.length - 1]] = { directory: {}, open: false };
              
              useFileSystem.getState().setFiles(this.initial.editorFiles);
              break;
            }
            case "remove_dir": {
              // propagate to zenfs
              console.log(" -> removing", sanitizedPath);
              try {
                const recursiveRemove = async (path: string) => {
                  const files = zenFs.readdirSync(path);
                  if (files.length > 0) {
                    for (const file of files) {
                      await recursiveRemove(`${path}/${file}`);
                    }
                  }
                  // check if path is valid
                  if (zenFs.existsSync(path)) {
                    await zenFs.promises.rm(path, { recursive: true });
                  }
                }
                recursiveRemove(sanitizedPath).then(() => {
                  console.log(" -> removed", sanitizedPath);
                }).catch((error) => {
                  console.log(" -> error removing", sanitizedPath, error);
                });
              } catch (error) {
                console.log(" -> error removing", sanitizedPath, error);
              }
              
              // update editor state
              let current = this.initial.editorFiles;
              const parts = sanitizedPath.split('/').filter(Boolean);
              for (let i = 0; i < parts.length - 1; i++) {
                current = (current[parts[i]] as { directory: typeof current }).directory;
              }
              delete current[parts[parts.length - 1]];
          
              useFileSystem.getState().setFiles(this.initial.editorFiles);
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

              let current = this.initial.editorFiles;
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

              useFileSystem.getState().setFiles(this.initial.editorFiles);
              break;
            }
            case "remove_file": {
              console.log(` -> Removing ${sanitizedPath}`);
              
              zenFs.unlinkSync(sanitizedPath);
              
              let current = this.initial.editorFiles;
              const parts = sanitizedPath.split('/').filter(Boolean);
              for (let i = 0; i < parts.length - 1; i++) {
                current = (current[parts[i]] as { directory: typeof current }).directory;
              }
              delete current[parts[parts.length - 1]];
              // update editor state
              useFileSystem.getState().setFiles(this.initial.editorFiles);
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
