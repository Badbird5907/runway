import { useWebContainer } from "@/components/container";
import { fileSystem } from "@/filesystem/zen-fs";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { EditorTabContent } from "@/ide/editor/tab-content";
import { EditorTab } from "@/ide/editor/tab";

type EditorWindow = {
  tabs: { path: string, content: string }[];
  activeTab: number;
}

type EditorState = {
  windows: EditorWindow[];
  activeWindow: number | null;

  addWindow: (tabs: string[]) => void;
  setActiveWindow: (id: number) => void;
  removeTabWithPath: (path: string, window: number) => void;
  addTabToWindow: (window: number, path: string) => void;
  addTabToActiveWindow: (path: string) => void;
  setActiveTab: (window: number, tab: number) => void;
}

export const useEditorState = create<EditorState>()(
  // persist(
  immer((set) => ({
    windows: [] as EditorWindow[],
    activeWindow: null as number | null,

    addWindow: (tabs: string[]) => {
      set((state) => {
        state.windows.push({
          tabs: tabs.map(path => ({ path, content: '' })),
          activeTab: 0
        });
      });
    },
    setActiveWindow: (id: number) => {
      set((state) => {
        state.activeWindow = id;
      });
    },
    removeTabWithPath: (path: string, window: number) => {
      set((state) => {
        const updateWindow = (w: EditorWindow) => {
          w.tabs = w.tabs.filter(tab => tab.path !== path);
          if (w.tabs.length > 0 && w.activeTab >= w.tabs.length) {
            w.activeTab = w.tabs.length - 1;
          }
        };

        if (window === -1) { // all windows
          console.log("removing tab", path, "from all windows");
          state.windows.forEach(updateWindow);
        } else {
          const w = state.windows[window];
          if (w) { // just this window
            console.log("removing tab", path, "from window", window);
            updateWindow(w);
          }
        }
      });
    },
    setActiveTab: (window: number, tab: number) => {
      set((state) => {
        state.windows[window].activeTab = tab;
      });
    },
    addTabToWindow: (window: number, path: string) => {
      set((state) => {
        const w = state.windows[window];
        if (w) {
          const existingTabIndex = w.tabs.findIndex(tab => tab.path === path);
          if (existingTabIndex >= 0) {
            w.activeTab = existingTabIndex;
          } else {
            w.tabs.push({ path, content: '' });
          }
        }
      });
    },
    addTabToActiveWindow: (path: string) => {
      set((state) => {
        if (state.activeWindow === null) {
          state.windows.push({
            tabs: [{ path, content: '' }],
            activeTab: 0
          });
          state.activeWindow = state.windows.length - 1;
        } else {
          const w = state.windows[state.activeWindow];
          if (w) {
            const existingTabIndex = w.tabs.findIndex(tab => tab.path === path);
            if (existingTabIndex >= 0) {
              w.activeTab = existingTabIndex;
              console.log("tab already exists, setting active tab to", existingTabIndex);
            } else {
              w.tabs.push({ path, content: '' });
              w.activeTab = w.tabs.length - 1;
              console.log("tab does not exist, adding it");
            }
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
      {editorState.windows.map((w, i) => { // TODO: this only works for one window atm
        return <div key={i}>
          <TabsPrimitive.Root value={w.activeTab + ""} onValueChange={(value) => editorState.setActiveTab(i, parseInt(value))} className="w-full">
            <TabsPrimitive.List className="bg-sidebar flex flex-row">
              {w.tabs.map((tab, j) => {
                return (
                  <EditorTab key={tab.path} path={tab.path} index={j} showFullPath={true} />
                )
              })}
            </TabsPrimitive.List>
            {w.tabs.map((tab, j) => {
              return <EditorTabContent key={tab.path} tab={tab.path} path={tab.path} index={j} />
            })}
          </TabsPrimitive.Root>
        </div>
      })}
    </div>
  )
}