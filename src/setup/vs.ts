import { initUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override'
import { initUserKeybindings } from '@codingame/monaco-vscode-keybindings-service-override'
import * as monaco from 'monaco-editor'
import * as vscode from 'vscode'
import { IWorkbenchConstructionOptions, LogLevel, IEditorOverrideServices } from 'vscode/services'
// import getScmServiceOverride from '@codingame/monaco-vscode-scm-service-override'
import { EnvironmentOverride } from 'vscode/workbench'
import { Worker } from '@/tools/crossOriginWorker'
import defaultKeybindings from '@/user/keybindings.json?raw'
import defaultConfiguration from '@/user/configuration.json?raw'
import { TerminalBackend } from '@/features/terminal'
import { workerConfig } from '@/tools/extHostWorker'
import { initFs } from '@/fs'
import { availableLanguages } from '@/setup/lang'
import getExtensionServiceOverride from '@codingame/monaco-vscode-extensions-service-override'
import getExtensionGalleryServiceOverride from '@codingame/monaco-vscode-extension-gallery-service-override'
import getTerminalServiceOverride from '@codingame/monaco-vscode-terminal-service-override'
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override'
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override'
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override'

import 'vscode/localExtensionHost'

const url = new URL(document.location.href)
const params = url.searchParams
export const remoteAuthority = params.get('remoteAuthority') ?? undefined
export const connectionToken = params.get('connectionToken') ?? undefined
export const remotePath =
  remoteAuthority != null ? (params.get('remotePath') ?? undefined) : undefined
export const resetLayout = params.has('resetLayout')
export const useHtmlFileSystemProvider = params.has('htmlFileSystemProvider')
params.delete('resetLayout')

window.history.replaceState({}, document.title, url.href)

export const workspaceFile = monaco.Uri.file('/workspace')

await initFs();

import "../webcontainer"

// Workers
export type WorkerLoader = () => Worker
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  TextEditorWorker: () =>
    new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
      type: 'module'
    }),
  TextMateWorker: () =>
    new Worker(
      new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url),
      { type: 'module' }
    ),
  OutputLinkDetectionWorker: () =>
    new Worker(
      new URL('@codingame/monaco-vscode-output-service-override/worker', import.meta.url),
      { type: 'module' }
    ),
  LanguageDetectionWorker: () =>
    new Worker(
      new URL(
        '@codingame/monaco-vscode-language-detection-worker-service-override/worker',
        import.meta.url
      ),
      { type: 'module' }
    ),
  NotebookEditorWorker: () =>
    new Worker(
      new URL('@codingame/monaco-vscode-notebook-service-override/worker', import.meta.url),
      { type: 'module' }
    ),
  LocalFileSearchWorker: () =>
    new Worker(
      new URL('@codingame/monaco-vscode-search-service-override/worker', import.meta.url),
      { type: 'module' }
    )
}
window.MonacoEnvironment = {
  getWorker: function (moduleId, label) {
    const workerFactory = workerLoaders[label]
    if (workerFactory != null) {
      return workerFactory()
    }
    throw new Error(`Unimplemented worker ${label} (${moduleId})`)
  }
}

// Set configuration before initializing service so it's directly available (especially for the theme, to prevent a flicker)
await Promise.all([
  initUserConfiguration(defaultConfiguration),
  initUserKeybindings(defaultKeybindings)
])

import { serviceOverrides } from "./overrides"

export const constructOptions: IWorkbenchConstructionOptions = {
  remoteAuthority,
  enableWorkspaceTrust: false,
  connectionToken,
  windowIndicator: {
    label: 'Runway IDE',
    tooltip: '',
    command: ''
  },
  workspaceProvider: {
    trusted: true,
    async open(workspace) {
      window.open(window.location.href)
      return true
    },
    workspace: !remotePath
      ? {
          folderUri: monaco.Uri.file('/workspace')
        }
      : {
          folderUri: monaco.Uri.from({
            scheme: 'vscode-remote',
            path: remotePath,
            authority: remoteAuthority
          })
        }
  },
  developmentOptions: {
    logLevel: LogLevel.Info // Default value
  },
  configurationDefaults: {
    // eslint-disable-next-line no-template-curly-in-string
    'window.title': 'Runway IDE${separator}${dirty}${activeEditorShort}'
  },
  defaultLayout: {
    editors: [
      {
        uri: monaco.Uri.file('/workspace/hello.txt'),
      }
    ],
    layout: {
      editors: {
        orientation: 0,
        groups: [{
          size: 1
        }]
      }
    },
    views: [
      {
        id: 'custom-view'
      }
    ],
    force: resetLayout
  },
  productConfiguration: {
    nameShort: 'runway-ide',
    nameLong: 'runway-ide',
    extensionsGallery: {
      serviceUrl: 'https://open-vsx.org/vscode/gallery',
      itemUrl: 'https://open-vsx.org/vscode/item',
      resourceUrlTemplate: 'https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}',
      controlUrl: '',
      nlsBaseUrl: '',
      publisherUrl: ''
    }
  }
}

export const envOptions: EnvironmentOverride = {
  // Otherwise, VSCode detect it as the first open workspace folder
  // which make the search result extension fail as it's not able to know what was detected by VSCode
  // userHome: vscode.Uri.file('/')
}

export const commonServices: IEditorOverrideServices = {
  ...getExtensionServiceOverride(workerConfig),
  ...getExtensionGalleryServiceOverride({ webOnly: false }),
  ...getTerminalServiceOverride(new TerminalBackend()),
  ...getStorageServiceOverride({
    fallbackOverride: {
      'workbench.activity.showAccounts': false
    }
  }),
  ...getRemoteAgentServiceOverride({ scanRemoteExtensions: true }),
  ...getLocalizationServiceOverride({
    async clearLocale() {
      const url = new URL(window.location.href)
      url.searchParams.delete('locale')
      window.history.pushState(null, '', url.toString())
    },
    async setLocale(id) {
      const url = new URL(window.location.href)
      url.searchParams.set('locale', id)
      window.history.pushState(null, '', url.toString())
    },
    availableLanguages,
  }),
  // ...getScmServiceOverride(),
  ...serviceOverrides
}