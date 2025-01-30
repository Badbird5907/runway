import { ExtensionHostKind, registerExtension } from "vscode/extensions";

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

channel.onmessage = (event) => {
  if (event.data === "new_tab") {
    void getApi().then(async (vscode) => {
      vscode.window.showErrorMessage("Another tab has been opened. Please close this tab to ensure data integrity.", { modal: true });
    });
  }
}