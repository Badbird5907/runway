import { ExtensionHostKind, registerExtension } from "vscode/extensions";
import * as vscode from "vscode";

const { getApi } = registerExtension(
  {
    name: "runway-multi-tab",
    publisher: "badbird",
    engines: {
      vscode: "*"
    },
    version: "1.0.0",
  },
  ExtensionHostKind.LocalProcess,
  {
    system: true
  }
)

const channel = new BroadcastChannel('tab_check');

channel.postMessage("new_tab");

let anotherTab = false;
channel.onmessage = (event) => {
  if (event.data === "new_tab") {
    anotherTab = true;
    void getApi().then(async (vscode) => {
      vscode.window.showErrorMessage("Detected a new tab has been opened. Please close this tab to ensure data is not lost.", { modal: true });
    });
  }
}