import { ExtensionHostKind, registerExtension } from "vscode/extensions";
import { getWebContainer } from "@/webcontainer";

const { getApi } = registerExtension(
  {
    name: "runway-webcontainer",
    publisher: "badbird",
    version: "1.0.0",
    engines: {
      vscode: "*"
    }
  },
  ExtensionHostKind.LocalProcess,
  {
    system: true
  }
)


void getApi().then(async () => {
  await getWebContainer();
});
