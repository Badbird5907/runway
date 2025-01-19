import { useWebContainer } from "@/components/container";
import { fileSystem } from "@/filesystem/zen-fs";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { TabsList } from "@radix-ui/react-tabs";
import { EditorTab } from "@/ide/editor/tab";

type EditorState = {
  windows: string[][];
  activeWindow: number | null;

  addWindow: (window: string[]) => void; // add a new window with the given tabs
  setActiveWindow: (id: number) => void; // set the active window to the given index
  removeTabWithPath: (path: string) => void; // remove the tab with the given path from all windows (file deleted)
  addTabToWindow: (window: number, path: string) => void; // add the tab with the given path to the given window
  addTabToActiveWindow: (path: string) => void; // add the tab with the given path to the active window
}

export const useEditorState = create<EditorState>()(
  // persist(
  immer((set) => ({
    windows: [] as string[][],
    activeWindow: null,

    addWindow: (window: string[]) => {
      return set((state) => ({ windows: [...state.windows, window] }));
    },
    setActiveWindow: (id: number) => {
      return set(() => ({ activeWindow: id }));
    },
    removeTabWithPath: (path: string) => {
      return set((state) => {
        const windows = state.windows.filter((window) => !window.includes(path));
        return { windows };
      });
    },
    addTabToWindow: (window: number, path: string) => {
      return set((state) => {
        const windows = state.windows.map((w, i) => {
          if (i === window) {
            return [...w, path]
          }
          return w
        });
        return { windows };
      });
    },
    addTabToActiveWindow: (path: string) => {
      return set((state) => {
          // if (state.activeWindow === null) {
          //   state.windows.push([path]);
          //   state.activeWindow = state.windows.length - 1;
          // } else {
          //   state.windows[state.activeWindow].push(path);
          // }
          if (state.activeWindow === null) {
            return { windows: [...state.windows, [path]], activeWindow: state.windows.length - 1 };
          } else {
            return { windows: state.windows.map((w, i) => {
              if (i === state.activeWindow) {
                return [...w, path];
              }
              return w;
            }), activeWindow: state.activeWindow };
          }
      });
    },
  })),
  // {
  //   name: "runway-editor-state",
  //   storage: createJSONStorage(() => localStorage),
  //   partialize: (state) => ({
  //     windows: state.windows.map((window) => ({
  //       id: window.id,
  //       file: window.file,
  //     })),
  //     activeWindow: state.activeWindow,
  //   }),
  //   onRehydrateStorage: (state) => {
  //     console.log('onRehydrateStorage', state);

  //   },
  // }
  // )
)

export const addOpenFile = (path: string, force: boolean = false) => {
  console.log("Opening file:", path);
  if (!fileSystem.canOpenFile(path, force)) {
    console.error("[x] file is not editable:", path);
    return;
  }
  // either add a new window if one doesnt already exist, or add the file to the existing window
  useEditorState.getState().addTabToActiveWindow(path);
  console.log("[!] -> state", useEditorState.getState());
}

export const IDEEditor = () => {
  const container = useWebContainer();
  const editorState = useEditorState();
  
  // const activeWindow = useMemo(() => editorState.windows.find((window) => window.id === editorState.activeWindow), [editorState.windows, editorState.activeWindow]);

  if (!container || container.status !== 'ready') { // TODO: just "freeze" the editor until the container is ready
    return <div>Loading WebContainer...</div>;
  }
  return (
    <div>
      {editorState.windows.map((w, i) => {
        return <div key={i}>
          <Tabs defaultValue={w[0]} className="w-full">
            <TabsList>
              {w.map((tab) => {
                return <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
              })}
            </TabsList>
            {w.map((tab) => {
              return <EditorTab key={tab} tab={tab} path={tab} />
            })}
          </Tabs>
        </div>
      })}
    </div>
  )
}