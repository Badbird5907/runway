import { IndexedDB, IndexedDBFileSystemProvider, InMemoryFileSystemProvider, registerCustomProvider, registerFileSystemOverlay } from "@codingame/monaco-vscode-files-service-override";
import { encode, toDisposable, toLocalISOString } from "@/util";
import { DisposableStore } from "vscode/vscode/vs/base/common/lifecycle";
import { URI } from "vscode/vscode/vs/base/common/uri";
import { Uri } from "monaco-editor";

export let fs: IndexedDBFileSystemProvider | InMemoryFileSystemProvider | undefined = undefined;
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

  let loggerFs: IndexedDBFileSystemProvider | InMemoryFileSystemProvider;
  // User data
  if (indexedDB) {
    fs = new IndexedDBFileSystemProvider("vscode-userdata", indexedDB, userDataStore, true);
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
  const workspace = await fs.readdir(uri)
  console.log("workspace", workspace)
  if (!workspace.length) {
    fs.mkdir(uri)
    fs.writeFile(Uri.file("/workspace/hello.txt"), encode("Welcome to Runway!"), { create: true, overwrite: true, unlock: true, atomic: false })
    fs.writeFile(Uri.file("/workspace/test.js"), encode("console.log('Hello, world!');"), { create: true, overwrite: true, unlock: true, atomic: false })
    console.log("opened")
    // call vscode.openFolder
  }
}
