import { TabsContent } from "@/components/ui/tabs";
import { fileSystem } from "@/filesystem/zen-fs";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";

export const EditorTab = ({ tab, path }: { tab: string, path: string }) => {
  const onChange = async (value: string | undefined) => {
    console.log("[!] -> onChange", value);
    await fileSystem.writeFileAsync(path, value || "");
  } /*useDebouncedCallback(async (value: string, path: string) => {
    await fileSystem.writeFileAsync(path, value);
  }, 300);*/
  const theme = useTheme();
  return (
    <TabsContent key={tab} value={tab}>
      <Editor
        height="90vh"
        path={tab}
        defaultValue={fileSystem.getEditableFileContent(tab, true) || ""}
        theme={theme.theme === 'dark' ? 'vs-dark' : 'vs-light'}
        onChange={onChange}
      />
    </TabsContent>
  )
}