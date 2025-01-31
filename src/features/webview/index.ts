import { ExtensionHostKind, registerExtension } from "vscode/extensions";
import * as vscode from "vscode";
import { devServerUrl, isWebContainerBooted } from "@/webcontainer";
import { eventBus } from "@/util/event-bus";

import styles from "./styles.css?raw";
import script from "./script.js?raw";

const { getApi } = registerExtension(
  {
    name: "runway-webview",
    publisher: "badbird",
    engines: { vscode: "*" },
    version: "1.0.0",
    contributes: {
      commands: [
        { command: "runway-webview.show", title: "Show Runway Webview" },
        { command: "runway-webview.reload", title: "Reload Runway Webview", icon: "refresh" }
      ],
      viewsContainers: {
        activitybar: [
          { id: "runway-webview", title: "Runway Webview", icon: "$(browser)" }
        ]
      },
      views: {
        "runway-webview": [
          { type: "webview", id: "runway-webview.provider", name: "Runway Webview" }
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
  { system: true }
);

void getApi().then(async (vscode) => {
  const context = vscode.extensions.getExtension("badbird.runway-webview");
  if (!context) {
    vscode.window.showErrorMessage("Runway Webview extension not found.");
    return;
  }
  const provider = new WebviewProvider();
  vscode.window.registerWebviewViewProvider("runway-webview.provider", provider);

  vscode.commands.registerCommand("runway-webview.show", async () => {
    await provider.show();
  });
  vscode.commands.registerCommand("runway-webview.reload", async () => {
    await provider.reload();
  });

  // listen for container events and reload when it changes
  eventBus.on("*", (t, e) => {
    if (t.toString().startsWith("container:")) {
      provider.reload();
    } else if (t.toString().startsWith("webview:")) {
      const [_, action] = t.toString().split(":");
      switch (action) {
        case "reload":
          provider.reload();
          break;
        case "openUrl":
          provider.reload(e as string);
          break;
      }
    }
  });
});


class WebviewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };

    // listen for messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "openExternal":
          const { url } = message;
          // parse the url
          const urlObj = new URL(url);
          // remove the cache-busting parameter
          urlObj.searchParams.delete('__cacheBuster');
          if (urlObj.hostname.endsWith("webcontainer-api.io")) {
						vscode.window.showWarningMessage("Opening webcontainer links are still a WIP.", { modal: true }, "Open").then((result) => {
							if (result === "Open") {
                // https://k03e2io1v3fx9wvj0vr8qd5q58o56n-fkdo--5173--d20a0a75.local-credentialless.webcontainer-api.io/
                // grab k03e2io1v3fx9wvj0vr8qd5q58o56n-fkdo--5173--d20a0a75
                const containerId = urlObj.hostname.split(".")[0];
                // open a new tab in the browser
                const baseUrl = window.location.origin;
                vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/webcontainer/preview/${containerId}`));
							}
						})


          } else {
            vscode.env.openExternal(vscode.Uri.parse(urlObj.toString()));
          }
          break;
        case "reloadIframe":
          // force a reload of the webview content
          this.reload();
          break;
      }
    });

    void this.reload();
  }

  public async reload(url = devServerUrl) {
    if (!this._view) {
      return;
    }

    if (!isWebContainerBooted()) {
      this._view.webview.html = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>Booting WebContainer...</h1>
          </body>
        </html>
      `;
      return;
    }

    if (!url) {
      this._view.webview.html = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>WebContainer booted!</h1>
            <p>No dev server detected!</p>
          </body>
        </html>
      `;
      return;
    }
    this._view.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          id="runway-webview-settings"
          data-settings='${this.escapeHtml(JSON.stringify({
            url,
            focusLockIndicatorEnabled: true
          }))}'

        />

        <style>
          ${styles}
        </style>
      </head>
      <body>
        <header class="header">
          <nav class="controls">
            <!--<button title="Back" class="back-button icon">&#x2190;</button>
            <button title="Forward" class="forward-button icon">&#x2192;</button>-->
            <button title="Reload" class="reload-button icon">&#x21bb;</button>
          </nav>
          <input class="url-input" type="text" />
          <nav class="controls">
            <button title="Open in browser" class="open-external-button icon">
						<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M1.5 1H6v1H2v12h12v-4h1v4.5l-.5.5h-13l-.5-.5v-13l.5-.5z"/><path d="M15 1.5V8h-1V2.707L7.243 9.465l-.707-.708L13.293 2H8V1h6.5l.5.5z"/></svg>
						</button>
          </nav>
        </header>
        <div class="content">
          <div class="iframe-focused-alert">Focus Lock</div>
          <iframe sandbox="allow-scripts allow-forms allow-same-origin allow-downloads"></iframe>
        </div>

        <script>
          ${script}
        </script>
      </body>
      </html>
    `;

    this._view.show?.(true);
  }

  public async show() {
    if (!this._view) return;
    await this.reload();
    this._view.show?.(true);
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, "&amp;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
  }
}
