import { FileType, IndexedDB, IndexedDBFileSystemProvider, InMemoryFileSystemProvider, registerCustomProvider, registerFileSystemOverlay } from "@codingame/monaco-vscode-files-service-override";
import { encode, toDisposable, toLocalISOString } from "@/util";
import { DisposableStore } from "vscode/vscode/vs/base/common/lifecycle";
import { URI } from "vscode/vscode/vs/base/common/uri";
import { Uri } from "monaco-editor";
import { DirectoryNode, FileNode, FileSystemTree, SymlinkNode } from "@webcontainer/api";
import { ZenFSProvider } from "@/fs/zen-fs";

export let fs: IndexedDBFileSystemProvider | InMemoryFileSystemProvider | ZenFSProvider | undefined = undefined;
export const initFs = async () => {
  const disposables = new DisposableStore();
  // IndexedDB is used for logging and user data
  let indexedDB: IndexedDB | undefined;
  const userDataStore = 'vscode-userdata-store';
  const logsStore = 'vscode-logs-store';
  const handlesStore = 'vscode-filehandles-store';
  try {
    indexedDB = await IndexedDB.create('vscode-web-db', 3, [userDataStore, logsStore, handlesStore]);
    // Close onWillShutdown
    disposables.add(toDisposable(() => indexedDB?.close()));
  } catch (error) {
    console.error('Error while creating IndexedDB', error);
  }
  const logsPath = URI.file(toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '')).with({ scheme: 'vscode-log' });

  let loggerFs: IndexedDBFileSystemProvider | InMemoryFileSystemProvider | ZenFSProvider;
  // User data
  if (indexedDB) {
    // fs = new IndexedDBFileSystemProvider("vscode-userdata", indexedDB, userDataStore, true);
    fs = new ZenFSProvider();
    loggerFs = new IndexedDBFileSystemProvider(logsPath.scheme, indexedDB, logsStore, true);
  } else {
    fs = new InMemoryFileSystemProvider();
    loggerFs = new InMemoryFileSystemProvider();
  }
  registerCustomProvider(logsPath.scheme, loggerFs); // Logger
  registerCustomProvider("vscode-userdata", fs);
  registerFileSystemOverlay(1, fs);

  // Local file access (if supported by browser)
  // if (WebFileSystemAccess.supported(mainWindow)) {
  //   registerCustomProvider("file", new HTMLFileSystemProvider(indexedDB, handlesStore, logService));
  // }

  // In-memory
  registerCustomProvider("tmp", new InMemoryFileSystemProvider());

  const uri = Uri.file("/workspace")
  let workspace: [string, FileType][] = []
  try {
    const stats = await fs.stat(uri)
    if (stats.type === FileType.Directory) {
      workspace = await fs.readdir(uri)
    }
  } catch (e) {
    // Directory doesn't exist yet
  }
  
  console.log("workspace", workspace)
  if (!workspace.length) {
    await fs.mkdir(uri)
    await fs.writeFile(Uri.file("/workspace/hello.txt"), encode("Welcome to Runway!"), { create: true, overwrite: true, unlock: true, atomic: false })
    await fs.writeFile(Uri.file("/workspace/test.js"), encode("console.log('Hello, world!');"), { create: true, overwrite: true, unlock: true, atomic: false })
    console.log("opened")
    // call vscode.openFolder
  }
}



// example
const example = {
  // This is a directory - provide its name as a key
  src: {
    // Because it's a directory, add the "directory" key
    directory: {
      // This is a file - provide its path as a key:
      'main.js': {
        // Because it's a file, add the "file" key
        file: {
          contents: `
            console.log('Hello from WebContainers!')
          `,
        },
      },
      // This is another file inside the same folder
      'main.css': {
        // Because it's a file, add the "file" key
        file: {
          contents: `
            body {
              margin: 0;
            }
          `,
        },
      },
    },
  },
  // This is a file outside the folder
  'package.json': {
    /* Omitted for brevity */
  },
  // This is another file outside the folder
  'index.html': {
    /* Omitted for brevity */
  },
};
/*export const buildFileTree = async (): Promise<FileSystemTree> => {
  if (!fs) {
    throw new Error("FS is not initialized!!");
  }
  const buildTree = async (path: string): Promise<DirectoryNode | FileNode | SymlinkNode> => {
    const stats = await fs!.stat(URI.file(path));
    if (stats.type & FileType.SymbolicLink) { // type can be a bitmask
      const symlink = stats.name
      SymlinkSupport
    }
  }
}
export const mountWebContainer = () => {
  
}*/