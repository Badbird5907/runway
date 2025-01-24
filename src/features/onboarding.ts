import { fs } from "@/fs";
import { Uri } from "vscode";
import { ExtensionHostKind } from "vscode/extensions";

import { registerExtension } from "vscode/extensions";

const { getApi } = registerExtension(
  {
    name: 'onboarding',
    publisher: 'badbird',
    version: '1.0.0',
    engines: {
      vscode: '*'
    }
  },
  ExtensionHostKind.LocalProcess
)

void getApi().then(async (vscode) => {
  setTimeout(async () => {
    console.log("onboarding")
    if (!fs) {
      vscode.window.showErrorMessage("Filesystem is not available! Please reload the page.")
      return
    }
    const uri = Uri.file("/workspace")
    await vscode.commands.executeCommand("vscode.openFolder", uri, {
      forceNewWindow: false,
      forceReuseWindow: true,
      noRecentEntry: false,
    })  
  }, 1000);
})
