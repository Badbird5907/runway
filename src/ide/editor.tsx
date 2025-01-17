import { useWebContainer } from "@/components/container";
import { fileSystem } from "@/filesystem/zen-fs";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import Editor from '@monaco-editor/react';
import { useTheme } from "next-themes";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent, TabsList } from "@radix-ui/react-tabs";

type EditorState = {
  windows: string[][]; // each window is an array of file paths (tabs)
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
    windows: [],
    activeWindow: null,

    addWindow: (window: string[]) => {
      set((state) => {
        state.windows.push(window);
        state.activeWindow = state.windows.length - 1;
      });
    },
    setActiveWindow: (id: number) => {
      set((state) => {
        state.activeWindow = id;
      });
    },
    removeTabWithPath: (path: string) => {
      set((state) => {
        state.windows = state.windows.filter((window) => !window.includes(path));
      });
    },
    addTabToWindow: (window: number, path: string) => {
      set((state) => {
        state.windows[window].push(path);
      });
    },
    addTabToActiveWindow: (path: string) => {
      set((state) => {
        if (state.activeWindow === null) {
          return {
            windows: [...state.windows, [path]],
            activeWindow: state.windows.length,
          }
        } else {
          return {
            windows: state.windows.map((window, i) => {
              if (i === state.activeWindow) {
                return [...window, path];
              }
              return window;
            }),
            activeWindow: state.activeWindow,
          }
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

export const addOpenFile = (path: string) => {
  console.log("Opening file:", path);
  const file = fileSystem.getEditableFileContent(path);
  if (!file) {
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
  const theme = useTheme();
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
              return <TabsContent key={tab} value={tab}>
                <Editor
                  height="90vh"
                  path={tab}
                  defaultValue={fileSystem.getEditableFileContent(tab) || ""}
                  theme={theme.theme === 'dark' ? 'vs-dark' : 'vs-light'}
                  onChange={(value) => {
                    fileSystem.writeFileSync(tab, value || '');
                  }}
                />
              </TabsContent>
            })}
          </Tabs>
        </div>
      })}
    </div>
  )
}