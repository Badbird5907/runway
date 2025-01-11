import { FilesIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { create } from "zustand";

export const pages: { [key: string]: {
  name: string;
  icon: React.ElementType;
  bottom?: boolean;
}} = {
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
  page: keyof typeof pages;
  setPage: (page: keyof typeof pages) => void;
}

export const useIDERouter = create<IDERouterState>()(
  (set) => ({
    page: "files",
    setPage: (page) => set({ page })
  })
)

