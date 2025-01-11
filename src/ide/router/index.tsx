import { FilesIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { create } from "zustand";

export type Page = {
  name: string;
  icon: React.ElementType;
  bottom?: boolean;
}
export type AllPages = "files" | "search" | "settings";
export const pages: { [key in AllPages]: Page} = {
  files: {
    name: "Files",
    icon: FilesIcon,
  },
  search: {
    name: "Search",
    icon: SearchIcon,
  },
  settings: {
    name: "Settings",
    icon: SettingsIcon,
    bottom: true,
  }
}

type IDERouterState = {
  page: AllPages;
  setPage: (page: AllPages) => void;
}

export const useIDERouter = create<IDERouterState>()(
  (set) => ({
    page: "files",
    setPage: (page) => set({ page })
  })
)

