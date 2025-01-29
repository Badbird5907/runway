import { FileChangeType, FileSystemProviderCapabilities, FileSystemProviderError, FileSystemProviderErrorCode, FileType, IFileChange, IFileDeleteOptions, IFileOverwriteOptions, IFileSystemProviderWithFileReadWriteCapability, IFileWriteOptions, IStat, IWatchOptions } from "@codingame/monaco-vscode-files-service-override";
import { Disposable, IDisposable } from "vscode/vscode/vs/base/common/lifecycle";
import { configure, ErrnoError, fs } from "@zenfs/core";
import { IndexedDB } from "@zenfs/dom"
import { Emitter, Event } from "vscode/vscode/vs/base/common/event";
import { URI } from "vscode/vscode/vs/base/common/uri";
import { DirectoryNode, FileNode, FileSystemTree, SymlinkNode } from "@webcontainer/api";
import { getWebContainer, isWebContainerBooted } from "@/webcontainer";

await configure({
  mounts: {
    "/": IndexedDB
  }
})
export class ZenFSProvider extends Disposable implements IFileSystemProviderWithFileReadWriteCapability {
  capabilities = 
    FileSystemProviderCapabilities.FileReadWrite | 
    FileSystemProviderCapabilities.FileOpenReadWriteClose;
  
  onDidChangeCapabilities = Event.None
  _onDidChangeFile = new Emitter<readonly IFileChange[]>()
  onDidChangeFile = this._onDidChangeFile.event
  
  async readFile(resource: URI): Promise<Uint8Array> {
    try {
      return await fs.promises.readFile(resource.path);
    } catch (e) {
      throw this.toFileSystemProviderError(e as ErrnoError);
    }
  }

  async writeFile(resource: URI, content: Uint8Array, opts: IFileWriteOptions & { webContainer?: boolean }): Promise<void> {
    try {
      console.log(" -> writeFile", resource.path, content)
      const promises = [fs.promises.writeFile(resource.path, content)];
      if (!opts.webContainer && isWebContainerBooted() && resource.path.startsWith("/home/workspace")) { // this did not come from webcontainer, so we need to propagate to webcontainer
        const wcPath = resource.path.substring("/home/workspace".length)
        promises.push(getWebContainer().then((wc) => wc.fs.writeFile(wcPath, content)));
      }
      await Promise.all(promises);
      this._fireSoon({ 
        type: opts.create ? FileChangeType.ADDED : FileChangeType.UPDATED, 
        resource 
      });
      
    } catch (e) {
      throw this.toFileSystemProviderError(e as ErrnoError);
    }
  }

  async stat(resource: URI): Promise<IStat> {
    try {
      const stats = await fs.promises.stat(resource.path);
      return {
        type: stats.isDirectory() ? FileType.Directory : FileType.File,
        size: stats.size,
        mtime: stats.mtime.getTime(),
        ctime: stats.ctime.getTime()
      };
    } catch (e) {
      throw this.toFileSystemProviderError(e as ErrnoError);
    }
  }

  async mkdir(resource: URI, opts?: { webContainer?: boolean; recursive?: boolean }): Promise<void> {
    try {
      const promises = [fs.promises.mkdir(resource.path, { recursive: opts?.recursive ?? false })];
      if (!opts?.webContainer && isWebContainerBooted() && resource.path.startsWith("/home/workspace")) {
        const wcPath = resource.path.substring("/home/workspace".length)
        promises.push(getWebContainer().then((wc) => wc.fs.mkdir(wcPath, { 
          recursive: (opts?.recursive ?? false) as true // FUCK YOU TYPESCRIPT I DO NOT CARE ABOUT THE RETURN TYPE JFC https://discord.com/channels/289587909051416579/555469074080202765/1333327174891077653 (PaperMC server)
        })))
      }
      await Promise.all(promises);
      this._fireSoon({ type: FileChangeType.ADDED, resource });
    } catch (e) {
      throw this.toFileSystemProviderError(e as ErrnoError);
    }
  }

  async readdir(resource: URI): Promise<[string, FileType][]> {
    try {
      const entries = await fs.promises.readdir(resource.path);
      const result: [string, FileType][] = [];
      
      for (const entry of entries) {
        const stats = await fs.promises.stat(`${resource.path}/${entry}`);
        result.push([
          entry,
          stats.isDirectory() ? FileType.Directory : FileType.File
        ]);
      }
      
      return result;
    } catch (e) {
      throw this.toFileSystemProviderError(e as ErrnoError);
    }
  }

  async delete(resource: URI, opts: IFileDeleteOptions & { webContainer?: boolean }): Promise<void> {
    if (opts.recursive) {
      try {
        const recursiveRemove = async (path: string) => { // odd zenfs quirk
          const entries = await fs.promises.readdir(path);
          if (entries.length > 0) {
            for (const file of entries) {
              await recursiveRemove(`${path}/${file}`).catch((e) => {
                console.log(" -> [1] error removing", resource.path, e);
              });
            }
          }
          // check if path is valid
          if (await fs.promises.exists(path)) {
            await fs.promises.rm(path, { recursive: true });
          }
        }
        const promises = [recursiveRemove(resource.path)];
        if (!opts.webContainer && isWebContainerBooted() && resource.path.startsWith("/home/workspace")) {
          const wcPath = resource.path.substring("/home/workspace".length)
          promises.push(getWebContainer().then((wc) => wc.fs.rm(wcPath, { recursive: true, force: true })));
        }
        await Promise.all(promises);
        this._fireSoon({ type: FileChangeType.DELETED, resource });
      } catch (error) {
        console.log(" -> error removing", resource.path, error);
      }
    } else {
      const promises = [fs.promises.rm(resource.path)];
      if (!opts.webContainer && isWebContainerBooted() && resource.path.startsWith("/home/workspace")) {
        const wcPath = resource.path.substring("/home/workspace".length)
        promises.push(getWebContainer().then((wc) => wc.fs.rm(wcPath, { force: true })));
      }
      await Promise.all(promises);
      this._fireSoon({ type: FileChangeType.DELETED, resource });
    }
  }

  async rename(from: URI, to: URI, opts?: IFileOverwriteOptions & { webContainer?: boolean }): Promise<void> {
    try {
      const promises = [fs.promises.rename(from.path, to.path)];
      if (!opts?.webContainer && isWebContainerBooted() && from.path.startsWith("/home/workspace")) {
        const wcFromPath = from.path.substring("/home/workspace".length)
        const wcToPath = to.path.substring("/home/workspace".length)
        promises.push(getWebContainer().then((wc) => wc.fs.rename(wcFromPath, wcToPath)));
      }
      await Promise.all(promises);
      this._fireSoon({ type: FileChangeType.UPDATED, resource: to });
    } catch (e) {
      throw this.toFileSystemProviderError(e as ErrnoError);
    }
  }

  watch(): IDisposable {
    return Disposable.None;
  }

  private toFileSystemProviderError(error: ErrnoError): FileSystemProviderError {
		if (error instanceof FileSystemProviderError) {
			return error; // avoid double conversion
		}

		let resultError: Error | string = error;
		let code: FileSystemProviderErrorCode;
		switch (error.code) {
			case 'ENOENT':
				code = FileSystemProviderErrorCode.FileNotFound;
				break;
			case 'EISDIR':
				code = FileSystemProviderErrorCode.FileIsADirectory;
				break;
			case 'ENOTDIR':
				code = FileSystemProviderErrorCode.FileNotADirectory;
				break;
			case 'EEXIST':
				code = FileSystemProviderErrorCode.FileExists;
				break;
			case 'EPERM':
			case 'EACCES':
				code = FileSystemProviderErrorCode.NoPermissions;
				break;
			default:
				code = FileSystemProviderErrorCode.Unknown;
		}

		return FileSystemProviderError.create(resultError, code);
	}
  private _bufferedChanges: IFileChange[] = []
  private _fireSoonHandle?: number
  private _fireSoon(...changes: IFileChange[]): void {
    this._bufferedChanges.push(...changes)

    if (this._fireSoonHandle != null) {
      clearTimeout(this._fireSoonHandle)
      this._fireSoonHandle = undefined
    }

    this._fireSoonHandle = window.setTimeout(() => {
      this._onDidChangeFile.fire(this._bufferedChanges)
      this._bufferedChanges.length = 0
    }, 5)
  }
}

export const buildFileTree = async () => {
  const buildTree = async (path: string): Promise<DirectoryNode | FileNode | SymlinkNode> => {
    const stats = await fs.promises.stat(path);
    
    if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(path).toString('utf-8');
      return {
        file: {
          symlink: target
        }
      };
    }
      
    if (stats.isFile()) {
      const buff = await fs.promises.readFile(path);
      return {
        file: {
            contents: buff
        }
      };
    }
      
    if (stats.isDirectory()) {
      const entries = await fs.promises.readdir(path);
      const webContainerTree: FileSystemTree = {};
      
      const buildPromises = entries.map(async (entry) => {
        const fullPath = path === '/' ? `/${entry}` : `${path}/${entry}`;
        const result = await buildTree(fullPath);
        return { entry, result };
      });

      const results = await Promise.all(buildPromises);
      
      for (const { entry, result } of results) {
        webContainerTree[entry] = result;
      }
      
      return {
        directory: webContainerTree
      };
    }
    
    throw new Error(`Unsupported file type at path: ${path}`);
  };

  console.log("building file tree")

  const dirs = await fs.promises.readdir("/home/workspace"); // TODO: implement projects by instead reading from /<project>/*
  console.log(" -> ", dirs)
  const buildPromises = dirs.map(async (dir) => {
    const result = await buildTree(`/home/workspace/${dir}`);
    return { dir, result };
  });

  const results = await Promise.all(buildPromises);
  
  const files: FileSystemTree = {};
  for (const { dir, result } of results) {
    files[dir] = result;
  }

  return files;
}
