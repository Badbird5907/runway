import { FileType, IndexedDB, IndexedDBFileSystemProvider, InMemoryFileSystemProvider, registerCustomProvider, registerFileSystemOverlay } from "@codingame/monaco-vscode-files-service-override";
import { encode, toDisposable, toLocalISOString } from "@/util";
import { DisposableStore } from "vscode/vscode/vs/base/common/lifecycle";
import { URI } from "vscode/vscode/vs/base/common/uri";
import { Uri } from "monaco-editor";
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
  let userDataFs: IndexedDBFileSystemProvider | InMemoryFileSystemProvider | ZenFSProvider;
  // User data
  if (indexedDB) {
    // fs = new IndexedDBFileSystemProvider("vscode-userdata", indexedDB, userDataStore, true);
    fs = new ZenFSProvider();
    userDataFs = new IndexedDBFileSystemProvider("vscode-userdata", indexedDB, userDataStore, true);
    loggerFs = new IndexedDBFileSystemProvider(logsPath.scheme, indexedDB, logsStore, true);
  } else {
    fs = new InMemoryFileSystemProvider();
    userDataFs = new InMemoryFileSystemProvider();
    loggerFs = new InMemoryFileSystemProvider();
  }
  registerCustomProvider(logsPath.scheme, loggerFs); // Logger
  registerCustomProvider("vscode-userdata", userDataFs);
  registerFileSystemOverlay(1, fs);

  // Local file access (if supported by browser)
  // if (WebFileSystemAccess.supported(mainWindow)) {
  //   registerCustomProvider("file", new HTMLFileSystemProvider(indexedDB, handlesStore, logService));
  // }

  // In-memory
  registerCustomProvider("tmp", new InMemoryFileSystemProvider());
  console.log("fs init done")
  const workspaceUri = Uri.file("/home/workspace")
  let workspace: [string, FileType][] = []
  try {
    const stats = await fs.stat(workspaceUri)
    if (stats.type === FileType.Directory) {
      workspace = await fs.readdir(workspaceUri)
    }
  } catch (e) {
    // Directory doesn't exist yet
    workspace = []
  }
  
  console.log("workspace", workspace)
  if ((!workspace || !workspace.length) && fs instanceof ZenFSProvider) {
    await fs.mkdir(workspaceUri, { recursive: true })
    await fs.writeFile(Uri.file("/home/workspace/hello.txt"), encode("Welcome to Runway!"), { create: true, overwrite: true, unlock: true, atomic: false })
    await fs.writeFile(Uri.file("/home/workspace/test.js"), encode("console.log('Hello, world!');"), { create: true, overwrite: true, unlock: true, atomic: false })
    console.log("opened")
    // call vscode.openFolder
  }
}
