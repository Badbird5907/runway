"use client";

import { TabsContent } from "@/components/ui/tabs";
import { fileSystem } from "@/filesystem/zen-fs";
import { Editor, loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";

loader.init().then((monaco) => {
  monaco.editor.defineTheme('runway-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    // set background to editor-background
    colors: {
      "editor.background": "#1f1f1f"
    }
  });
});
export const EditorTabContent = ({ tab, path, index }: { tab: string, path: string, index: number }) => {
  const onChange = async (value: string | undefined) => {
    console.log("[!] -> onChange", value);
    await fileSystem.writeFileAsync(path, value || "");
  } /*useDebouncedCallback(async (value: string, path: string) => {
    await fileSystem.writeFileAsync(path, value);
  }, 300);*/
  const theme = useTheme();
  return (
    <TabsContent key={tab} value={index + ""} className="mt-0">
      <Editor
        height="90vh"
        path={tab}
        defaultValue={fileSystem.getEditableFileContent(tab, true) || ""}
        theme={theme.theme === 'dark' ? 'vs-dark' : 'vs-light'}
        onMount={(editor, monaco) => {
          monaco.editor.setTheme('runway-dark');
        }}
        onChange={onChange}
      />
    </TabsContent>
  )
}