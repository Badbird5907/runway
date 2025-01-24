import { FileSystemProviderCapabilities, FileSystemProviderError, FileSystemProviderErrorCode, FileType, IFileChange, IFileDeleteOptions, IFileOverwriteOptions, IFileSystemProviderWithFileReadWriteCapability, IFileWriteOptions, IStat, IWatchOptions } from "@codingame/monaco-vscode-files-service-override";
import { Disposable, IDisposable } from "vscode/vscode/vs/base/common/lifecycle";
import { configure, ErrnoError, fs } from "@zenfs/core";
import { IndexedDB } from "@zenfs/dom"
import { Event } from "vscode/vscode/vs/base/common/event";
import { URI } from "vscode/vscode/vs/base/common/uri";

await configure({
  mounts: {
    "/": IndexedDB
  }
})
export class ZenFSProvider extends Disposable implements IFileSystemProviderWithFileReadWriteCapability {
  capabilities = 
    FileSystemProviderCapabilities.FileReadWrite | 
    FileSystemProviderCapabilities.FileOpenReadWriteClose;
  
  onDidChangeCapabilities = Event.None;
  onDidChangeFile = Event.None;
  
  async readFile(resource: URI): Promise<Uint8Array> {
    try {
      return await fs.promises.readFile(resource.path);
    } catch (e) {
      throw this.toFileSystemProviderError(e as ErrnoError);
    }
  }

  async writeFile(resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> {
    try {
      await fs.promises.writeFile(resource.path, content);
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

  async mkdir(resource: URI): Promise<void> {
    try {
      await fs.promises.mkdir(resource.path);
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

  async delete(resource: URI, opts: IFileDeleteOptions): Promise<void> {
    if (opts.recursive) {
      try {
        const recursiveRemove = async (path: string) => { // odd zenfs quirk
          const files = await fs.promises.readdir(path);
          if (files.length > 0) {
            for (const file of files) {
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
        await recursiveRemove(resource.path).then(() => {
          console.log(" -> removed", resource.path);
        }).catch((error) => {
          console.log(" -> error removing", resource.path, error);
        });
      } catch (error) {
        console.log(" -> error removing", resource.path, error);
      }
    } else {
      const stats = await fs.promises.stat(resource.path);
      if (stats.isDirectory()) {
        await fs.promises.rmdir(resource.path);
      } else {
        await fs.promises.unlink(resource.path);
      }
    }
  }

  async rename(from: URI, to: URI): Promise<void> {
    try {
      await fs.promises.rename(from.path, to.path);
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
}