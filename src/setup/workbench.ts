import {
  IStorageService,
  IWorkbenchLayoutService,
  getService,
  initialize as initializeMonacoService
} from 'vscode/services'
import getWorkbenchServiceOverride from '@codingame/monaco-vscode-workbench-service-override'
import getQuickAccessServiceOverride from '@codingame/monaco-vscode-quickaccess-service-override'
import { BrowserStorageService } from '@codingame/monaco-vscode-storage-service-override'
import { ExtensionHostKind } from '@codingame/monaco-vscode-extensions-service-override'
import { registerExtension } from 'vscode/extensions'
import '@/features/customView.workbench'
import {
  commonServices,
  constructOptions,
  envOptions,
  remoteAuthority,
} from './vs'

const container = document.createElement('div')
container.style.height = '100vh'

document.body.replaceChildren(container)

// Override services
await initializeMonacoService(
  {
    ...commonServices,
    ...getWorkbenchServiceOverride(),
    ...getQuickAccessServiceOverride({
      isKeybindingConfigurationVisible: () => true,
      shouldUseGlobalPicker: (_editor) => true
    })
  },
  container,
  constructOptions,
  envOptions
)

export async function clearStorage(): Promise<void> {
  // await userDataProvider.reset()
  await ((await getService(IStorageService)) as BrowserStorageService).clear()
}

await registerExtension(
  {
    name: 'demo',
    publisher: 'codingame',
    version: '1.0.0',
    engines: {
      vscode: '*'
    }
  },
  ExtensionHostKind.LocalProcess
).setAsDefaultApi()

export { remoteAuthority }
