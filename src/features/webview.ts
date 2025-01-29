import { ExtensionHostKind, registerExtension } from "vscode/extensions";
import * as vscode from "vscode";
import { devServerUrl, getWebContainer, isWebContainerBooted } from "@/webcontainer";
import { eventBus } from "@/util/event-bus";

const { getApi } = registerExtension(
  {
    name: "runway-webview",
    publisher: "badbird",
    engines: {
      vscode: "*"
    },
    version: "1.0.0",
    contributes: {
      commands: [
        {
          command: "runway-webview.show",
          title: "Show Runway Webview"
        },
        {
          command: "runway-webview.reload",
          title: "Reload Runway Webview",
          icon: "refresh"
        }
      ],
      viewsContainers: {
        activitybar: [
          {
            id: "runway-webview",
            title: "Runway Webview",
            icon: "$(browser)"
          }
        ]
      },
      views: {
        "runway-webview": [
          {
            type: "webview",
            id: "runway-webview.provider",
            name: "Runway Webview"
          }
        ]
      },
      menus: {
        "view/title": [
          {
            command: "runway-webview.reload",
            group: "navigation",
            when: "view == runway-webview.provider"
          }
        ]
      }
    },
    
  },
  ExtensionHostKind.LocalProcess,
  {
    system: true
  }
)

void getApi().then(async (vscode) => {
  const context = vscode.extensions.getExtension("badbird.runway-webview")
  if (!context) {
    vscode.window.showErrorMessage("Runway Webview extension not found!! wtf??")
    return
  }
  const provider = new WebviewProvider()
  vscode.window.registerWebviewViewProvider("runway-webview.provider", provider)

  vscode.commands.registerCommand("runway-webview.show", async () => {
    await provider.show()
  })
  vscode.commands.registerCommand("runway-webview.reload", async () => {
    await provider.reload();
  })

  eventBus.on("*", (t) => {
    const type = t.toString();

    if (type.startsWith("container:")) {
      provider.reload()
    }
  })
})

class WebviewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Thenable<void> | void {
    const { webview } = webviewView
    this._view = webviewView
    webview.options = {
      enableScripts: true,
    }
    webview.onDidReceiveMessage((message) => {
      console.log(message)
    })
    // Load initial content when view is created
    return this.reload();
  }

  public async reload() {
    if (!this._view) {
      return
    }
    const booted = isWebContainerBooted();
    if (!booted) {
      this._view.webview.html = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Booting WebContainer...</h1>
        </body>
      </html>
      `
      return
    }

    if (devServerUrl) {
      this._view.webview.html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body, html {
                margin: 0;
                padding: 0;
                height: 100vh;
                width: 100vw;
                overflow: hidden;
              }
              iframe {
                border: none;
                width: 100%;
                height: 100%;
              }
            </style>
          </head>
          <body>
            <iframe src="${devServerUrl}"></iframe>
          </body>
        </html>
      `
    this._view?.show?.();
    } else {   
      this._view.webview.html = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>WebContainer booted!</h1>
            <span>No dev server detected!</span>
          </body>
        </html>
      `
    }
  }

  public async show() {
    if (!this._view) {
      return
    }
    await this.reload();
    this._view.show?.(true)
  }
}
