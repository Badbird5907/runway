import * as TabsPrimitive from "@radix-ui/react-tabs"
import { X } from "lucide-react"
import { FileIcon } from "@/components/file-icon";
import { useEditorState } from "@/ide/editor";
import { useMemo } from "react";

export const EditorTab = ({ path, index, showFullPath }: { path: string, index: number, showFullPath?: boolean }) => {
  const removeTabWithPath = useEditorState((state) => state.removeTabWithPath);
  const name = useMemo(() => {
    if (showFullPath) {
      return path;
    }
    return path.substring(path.lastIndexOf('/') + 1);
  }, [path, showFullPath]);
  return (
    <TabsPrimitive.Trigger key={path} value={index + ""} className="p-2 flex flex-row gap-2 data-[state=active]:bg-editor-background hover:bg-sidebar-accent bg-sidebar border-t border-x border-sidebar-accent place-items-center">
      <FileIcon node={{ file: { size: 0, isBinary: false } }} name={name} className="" />
      {name}
      <div onClick={(e) => {
        e.stopPropagation();
        console.log("close");
        removeTabWithPath(path, index);
      }} className="hover:bg-sidebar-accent rounded-md p-1">
        <X className="w-4 h-4 hover:text-red-500" />
      </div>
    </TabsPrimitive.Trigger>
  )
}

