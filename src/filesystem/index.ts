import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// example data structure
// const files = {
//   "test.txt": {
//     file: {
//       size: 1024,
//     }
//   },
//   "test.js": {
//     file: {
//       size: 1024,
//     }
//   },
//   "dir": {
//     directory: {
//       "test.txt": {
//         file: {
//           size: 1024,
//         }
//       },
//       "symlink-file": {
//         symlink: {
//           target: "test.txt",
//         }
//       },
//     }
//   }
// }

export type FSFile = {
  file: {
    size: number;
    isBinary: boolean;
  }
}
export type FSDirectory = {
  directory: {
    [key: string]: FSFile | FSDirectory | FSSymlink;
  }
  open: boolean;
}
export type FSSymlink = {
  symlink: {
    target: string;
  }
}

export type FSNode = FSFile | FSDirectory | FSSymlink;

type FileSystemState = {
  files: FSDirectory;
  setFiles: (files: FSDirectory) => void;
}

export const useFileSystem = create<FileSystemState>()(
  immer((set) => ({
    files: {
      directory: {},
      open: true,
    },
    setFiles: (files) => set({ files }),
  }))
)
