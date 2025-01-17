import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { FSNode } from "@/filesystem";
import { FSDirectory, useFileSystem } from "@/filesystem";
import { FileIcon } from '@/components/file-icon';
import { fileSystem } from '@/filesystem/zen-fs';
import { addOpenFile } from '@/ide/editor';
interface FileTreeNodeProps {
  name: string;
  node: FSNode;
  level: number;
  fullPath: string;
}


const sortedEntries = (files: FSDirectory) => {
  return Object.entries(files.directory).sort((a, b) => {
    const aIsDirectory = 'directory' in a[1];
    const bIsDirectory = 'directory' in b[1];
    if (aIsDirectory !== bIsDirectory) { // prioritize directories
      return aIsDirectory ? -1 : 1;
    }
    return a[0].localeCompare(b[0]); // sort alphabetically
  });
}
export const FileTreeNode: React.FC<FileTreeNodeProps> = ({ name, node, level, fullPath }) => {
  const [isOpen, setIsOpen] = useState((node as FSDirectory).open || false);
  const { setFiles, files } = useFileSystem();

  const click = () => {
    console.log(" -> node", node)
    if ('directory' in node) {
      setIsOpen(!isOpen);
      console.log("toggle", fullPath);
      let current = files;
      const parts = fullPath.split('/').filter(Boolean);
      for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) {
          current.directory[parts[i]] = {
            ...current.directory[parts[i]],
            open: !isOpen,
          };
        } else {
          current = current.directory[parts[i]] as FSDirectory;
        }
      }
      setFiles({ ...files });
    } else if ('symlink' in node) {
      const target = node.symlink.target;
      const targetPath = `${fullPath}/${target}`; // TODO: make sure this works
      const targetFile = fileSystem.getEditableFileContent(targetPath);
      if (targetFile) {
        addOpenFile(targetPath);
      }
    } else if ('file' in node) {
      if (!node.file.isBinary) {
        addOpenFile(fullPath);
      } else {
        console.log(" -> binary file", fullPath);
      }
    }
  };

  const getIcon = () => {
    return <FileIcon node={node} name={name} />
  };
  const getChevron = () => {
    if ('directory' in node) {
      return isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />;
    }
    return <span className="w-4" />;
  };
  const sorted = "directory" in node ? sortedEntries(node) : [];

  return (
    <div className="group/tree relative">
      {level > 0 && (
        <div className="absolute w-px bg-transparent group-hover/tree:bg-[#606060] transition-colors z-10"
             style={{ // this is the line
               left: `${level * 8 + 4}px`,
               top: 0,
               bottom: 0,
             }} />
      )}
      <div
        className={`flex items-center py-1 px-2 hover:bg-[#2A2D2E] cursor-pointer relative`}
        style={{
          paddingLeft: `${level * 8 + 12}px`,
        }}
        onClick={click}
      >
        {getChevron()}
        {getIcon()}
        <span className="ml-1">{name}</span>
      </div>
      {isOpen && 'directory' in node && (
        <div>
          {sorted.map(([childName, childNode]) => (
            <FileTreeNode key={childName} name={childName} node={childNode} level={level + 1} fullPath={`${fullPath}/${childName}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FilesPage = () => {
  const { files } = useFileSystem();
  const sorted = sortedEntries(files);
  
  return (
    <div className="group bg-sidebar p-2 font-mono text-sm h-full overflow-auto">
      <h2 className="font-semibold font-sans mb-2">EXPLORER</h2>
      {sorted.map(([name, node]) => (
        <FileTreeNode key={name} name={name} node={node} level={0} fullPath={"/" + name} />
      ))}
    </div>
  );
}