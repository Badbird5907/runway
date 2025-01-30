import { ExtensionHostKind, registerExtension } from "vscode/extensions";
import * as vscode from "vscode";
import { devServerUrl, isWebContainerBooted } from "@/webcontainer";
import { eventBus } from "@/util/event-bus";

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
  eventBus.on("*", (t) => {
    if (t.toString().startsWith("container:")) {
      provider.reload();
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
          if (urlObj.hostname === "webcontainer-api.io") {
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

  public async reload() {
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

    if (!devServerUrl) {
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

        <!-- Provide settings to the script via data-settings -->
        <meta
          id="simple-browser-settings"
          data-settings='${this.escapeHtml(JSON.stringify({
            url: devServerUrl,
            focusLockIndicatorEnabled: true
          }))}'
        />

        <style>
          :root {
            --container-paddding: 20px;
            --input-padding-vertical: 2px;
            --input-padding-horizontal: 4px;
            --input-margin-vertical: 4px;
            --input-margin-horizontal: 0;
          }
          html, body {
            height: 100%;
            min-height: 100%;
            padding: 0;
            margin: 0;
          }
          body {
            display: grid;
            grid-template-rows: auto 1fr;
          }
          input:not([type='checkbox']), textarea {
            display: block;
            width: 100%;
            border: none;
            margin-right: 0.3em;
            font-family: var(--vscode-font-family);
            padding: var(--input-padding-vertical) var(--input-padding-horizontal);
            color: var(--vscode-input-foreground);
            outline-color: var(--vscode-input-border);
            background-color: var(--vscode-input-background);
          }
          input::placeholder, textarea::placeholder {
            color: var(--vscode-input-placeholderForeground);
          }
          button {
            border: none;
            padding: 3px;
            text-align: center;
            outline: 1px solid transparent;
            color: var(--vscode-icon-foreground);
            background: none;
            border-radius: 5px;
          }
          button:hover:not(:disabled) {
            cursor: pointer;
            color: var(--vscode-toolbar-hoverForeground);
            background: var(--vscode-toolbar-hoverBackground);
          }
          button:disabled { opacity: 0.5; }
          input:focus, button:focus { outline-color: var(--vscode-focusBorder); }
          .header {
            display: flex;
            margin: 0.4em 1em;
          }
          .url-input {
            flex: 1;
          }
          .controls { display: flex; }
          .controls button {
            display: flex;
            margin-right: 0.3em;
          }
          .content {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: white;
          }
          .iframe-focused-alert {
            display: none;
            position: absolute;
            bottom: 1em;
            background: var(--vscode-editorWidget-background);
            color: var(--vscode-editorWidget-foreground);
            padding: 0.2em 0.2em;
            border-radius: 4px;
            font-size: 8px;
            font-family: monospace;
            user-select: none;
            pointer-events: none;
          }
          .iframe-focused.enable-focus-lock-indicator .iframe-focused-alert {
            display: block;
          }
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
            <button title="Open in browser" class="open-external-button icon">&#x1F517;</button>
          </nav>
        </header>
        <div class="content">
          <div class="iframe-focused-alert">Focus Lock</div>
          <iframe sandbox="allow-scripts allow-forms allow-same-origin allow-downloads"></iframe>
        </div>

        <script>
          // Minimal "onceDocumentLoaded" helper
          function onceDocumentLoaded(cb) {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
              cb();
            } else {
              document.addEventListener('DOMContentLoaded', cb);
            }
          }

          const vscode = acquireVsCodeApi();

          // Pull initial config from meta's data-settings
          function getSettings() {
            const el = document.getElementById('simple-browser-settings');
            if (!el) {
              throw new Error('No settings element found');
            }
            const data = el.getAttribute('data-settings');
            if (!data) {
              throw new Error('No settings data found');
            }
            return JSON.parse(data);
          }

          const settings = getSettings();

          const iframe = document.querySelector('iframe');
          const header = document.querySelector('.header');
          const input = header.querySelector('.url-input');
          // const forwardButton = header.querySelector('.forward-button');
          // const backButton = header.querySelector('.back-button');
          const reloadButton = header.querySelector('.reload-button');
          const openExternalButton = header.querySelector('.open-external-button');

          function simplifyUrl(url) {
            try {
              const urlObj = new URL(url);
              // remove the cache-busting parameter
              urlObj.searchParams.delete('__cacheBuster');
              
              if (urlObj.hostname.includes('webcontainer-api.io')) {
                // beautify the URL
                return 'https://container' + urlObj.pathname + urlObj.search;
              }
              return urlObj.toString();
            } catch {
              return url;
            }
          }

          function restoreUrl(url) {
            try {
              const urlObj = new URL(url);
              if (urlObj.hostname === 'container') {
                // Replace the simplified URL with the actual WebContainer URL
                const currentIframeUrl = new URL(iframe.src);
                return currentIframeUrl.origin + urlObj.pathname + urlObj.search;
              }
              return url;
            } catch {
              return url;
            }
          }

          // Setup focus-lost detection
          window.addEventListener('message', e => {
            switch (e.data.type) {
              case 'focus':
                iframe.focus();
                break;
              case 'didChangeFocusLockIndicatorEnabled':
                toggleFocusLockIndicatorEnabled(e.data.enabled);
                break;
            }
          });

          onceDocumentLoaded(() => {
            // Check if the iframe is focused
            setInterval(() => {
              const iframeFocused = document.activeElement?.tagName === 'IFRAME';
              document.body.classList.toggle('iframe-focused', iframeFocused);
            }, 50);

            // Hooks
            iframe.addEventListener('load', () => {
              // Noop
            });

            input.addEventListener('change', e => {
              const rawUrl = e.target.value;
              const actualUrl = restoreUrl(rawUrl);
              navigateTo(actualUrl);
            });

            // forwardButton.addEventListener('click', () => {
            //   history.forward();
            // });

            // backButton.addEventListener('click', () => {
            //   history.back();
            // });

            openExternalButton.addEventListener('click', () => {
              vscode.postMessage({
                type: 'openExternal',
                url: restoreUrl(input.value)
              });
            });

            reloadButton.addEventListener('click', () => {
              navigateTo(restoreUrl(input.value));
            });

            // initial load
            navigateTo(settings.url);
            input.value = simplifyUrl(settings.url);
            toggleFocusLockIndicatorEnabled(settings.focusLockIndicatorEnabled);
          });

          function navigateTo(rawUrl) {
            try {
              const url = new URL(rawUrl);
              // force cache skip
              url.searchParams.append('__cacheBuster', Date.now().toString());
              iframe.src = url.toString();
              // update url
              input.value = simplifyUrl(url.toString());
            } catch {
              // If invalid URL, just push rawUrl
              iframe.src = rawUrl;
              input.value = simplifyUrl(rawUrl);
            }

            // save the state
            vscode.setState({ url: rawUrl });
          }

          function toggleFocusLockIndicatorEnabled(enabled) {
            document.body.classList.toggle('enable-focus-lock-indicator', enabled);
          }
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
