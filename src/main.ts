import { useHtmlFileSystemProvider } from "@/setup/vs"
import { ExtensionHostKind } from "vscode/extensions"

import { registerExtension } from "vscode/extensions"

const { getApi } = registerExtension(
  {
    name: 'demo-main',
    publisher: 'codingame',
    version: '1.0.0',
    engines: {
      vscode: '*'
    }
  },
  ExtensionHostKind.LocalProcess
)

void getApi().then(async (vscode) => {
  if (!useHtmlFileSystemProvider) {
    const mainModelUri = vscode.Uri.file('/home/workspace/test.js')
    await Promise.all([
      vscode.workspace.openTextDocument(mainModelUri),
      vscode.workspace.openTextDocument(vscode.Uri.file('/home/workspace/test_readonly.js')) // open the file so vscode sees it's locked
    ])
  }
})