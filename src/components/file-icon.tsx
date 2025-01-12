import { FSNode } from '@/filesystem';
import { useMemo } from 'react';
import { getIconForFile, getIconForFolder, getIconForOpenFolder } from 'vscode-icons-js';
import Image from 'next/image';

const baseUrl = "https://cdn.badbird.dev/assets/icons/vs/";
export const FileIcon = ({ node, name }: { node: FSNode, name: string }) => {
  const icon = useMemo(() => {
    if ("directory" in node) {
      return node.open ? getIconForOpenFolder(name) : getIconForFolder(name);
    }
    return getIconForFile(name);
  }, [name, node]);

  console.log(icon);

  return <Image src={`${baseUrl}${icon}`} alt={name} width={16} height={16} />;
}