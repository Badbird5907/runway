import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FileSymlink } from 'lucide-react';
import { FSNode } from "@/filesystem";
import { FSDirectory, useFileSystem } from "@/filesystem";

interface FileTreeNodeProps {
  name: string;
  node: FSNode;
  level: number;
  fullPath: string;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({ name, node, level, fullPath }) => {
  const [isOpen, setIsOpen] = useState((node as FSDirectory).open || false);
  const { setFiles, files } = useFileSystem();

  const toggleOpen = () => {
    if ('directory' in node) {
      setIsOpen(!isOpen);
      console.log("toggle", fullPath);
      let current = files;
      const parts = fullPath.split('/').filter(Boolean);
      for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) {
          current[parts[i]] = {
            ...current[parts[i]],
            open: !isOpen,
          };
        } else {
          current = (current[parts[i]] as { directory: typeof current }).directory;
        }
      }
      setFiles({ ...files });
    }
  };

  const getIcon = () => {
    if ('file' in node) return <File size={16} />;
    if ('symlink' in node) return <FileSymlink size={16} />;
    return isOpen ? <FolderOpen size={16} /> : <Folder size={16} />;
  };

  const getChevron = () => {
    if ('directory' in node) {
      return isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />;
    }
    return <span className="w-4" />;
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-[#2A2D2E] cursor-pointer`}
        style={{ paddingLeft: `${level * 8 + 4}px` }}
        onClick={toggleOpen}
      >
        {getChevron()}
        {getIcon()}
        <span className="ml-1">{name}</span>
      </div>
      {isOpen && 'directory' in node && (
        <div>
          {Object.entries(node.directory).map(([childName, childNode]) => (
            <FileTreeNode key={childName} name={childName} node={childNode} level={level + 1} fullPath={`${fullPath}/${childName}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FilesPage = () => {
  const { files } = useFileSystem();

  return (
    <div className="bg-sidebar p-2 font-mono text-sm h-full overflow-auto">
      <h2 className="text-[#BBBBBB] font-semibold mb-2">EXPLORER</h2>
      {Object.entries(files).map(([name, node]) => (
        <FileTreeNode key={name} name={name} node={node} level={0} fullPath={"/" + name} />
      ))}
    </div>
  );
}