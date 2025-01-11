import { FilesPage } from "@/ide/pages/files";
import { SearchPage } from "@/ide/pages/search";
import { SettingsPage } from "@/ide/pages/settings";
import { useIDERouter } from "@/ide/router";

export const IDESidebarContent = () => {
  const page = useIDERouter((state) => state.page);
  return (
    <div className="bg-sidebar h-full">
      {page === "files" && <FilesPage />}
      {page === "search" && <SearchPage />}
      {page === "settings" && <SettingsPage />}
    </div>
  )
}