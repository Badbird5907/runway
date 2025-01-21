import * as vscode from 'vscode';
import { LogLevel } from 'vscode/services';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override';
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override';
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override';
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override';
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override';

// this is required syntax highlighting
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import '@codingame/monaco-vscode-search-result-default-extension';

import '../resources/vsix/open-collaboration-tools.vsix';

import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { defaultHtmlAugmentationInstructions, defaultViewsInit } from 'monaco-editor-wrapper/vscode/services';
import { configureMonacoWorkers, createDefaultWorkspaceFile } from './utils';

export type ConfigResult = {
    wrapperConfig: WrapperConfig
    workspaceFile: vscode.Uri;
    helloTsUri: vscode.Uri;
    testerTsUri: vscode.Uri;
};

export const configure = (htmlContainer?: HTMLElement): ConfigResult => {
    const workspaceFile = vscode.Uri.file('/workspace/.vscode/workspace.code-workspace');

    const wrapperConfig: WrapperConfig = {
        $type: 'extended',
        id: 'AAP',
        logLevel: LogLevel.Debug,
        htmlContainer,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getConfigurationServiceOverride(),
                ...getKeybindingsServiceOverride(),
                ...getLifecycleServiceOverride(),
                ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
                ...getBannerServiceOverride(),
                ...getStatusBarServiceOverride(),
                ...getTitleBarServiceOverride(),
                ...getExplorerServiceOverride(),
                ...getRemoteAgentServiceOverride(),
                ...getEnvironmentServiceOverride(),
                ...getSecretStorageServiceOverride(),
                ...getStorageServiceOverride(),
                ...getSearchServiceOverride()
            },
            enableExtHostWorker: true,
            viewsConfig: {
                viewServiceType: 'ViewsService',
                htmlAugmentationInstructions: defaultHtmlAugmentationInstructions,
                viewsInitFunc: defaultViewsInit
            },
            workspaceConfig: {
                enableWorkspaceTrust: true,
                windowIndicator: {
                    label: 'Runway Web IDE',
                    tooltip: '',
                    command: ''
                },
                workspaceProvider: {
                    trusted: true,
                    async open() {
                        window.open(window.location.href);
                        return true;
                    },
                    workspace: {
                        workspaceUri: workspaceFile
                    }
                },
                configurationDefaults: {
                    'window.title': 'runway-ide${separator}${dirty}${activeEditorShort}'
                },
                productConfiguration: {
                    nameShort: 'runway-ide',
                    nameLong: 'runway-ide'
                }
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.wordBasedSuggestions': 'off',
                    'typescript.tsserver.web.projectWideIntellisense.enabled': true,
                    'typescript.tsserver.web.projectWideIntellisense.suppressSemanticErrors': false,
                    'editor.guides.bracketPairsHorizontal': true,
                    'oct.serverUrl': 'https://api.open-collab.tools/',
                    'editor.experimental.asyncTokenization': false
                })
            },
        },
        extensions: [{
            config: {
                name: 'runway-ide',
                publisher: 'badbird.dev',
                version: '1.0.0',
                engines: {
                    vscode: '*'
                }
            }
        }],
        editorAppConfig: {
            monacoWorkerFactory: configureMonacoWorkers
        }
    };

    const helloTsUri = vscode.Uri.file('/workspace/hello.ts');
    const testerTsUri = vscode.Uri.file('/workspace/tester.ts');
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloTsUri, `function sayHello(): string {
    // intentionally erroneous to test import resolution
    console.log(sayFoo());
    return 'Hello';
};

sayHello();
`));
    fileSystemProvider.registerFile(new RegisteredMemoryFile(testerTsUri, `export const sayFoo = () => {
    return 'Foo';
};
`));
    fileSystemProvider.registerFile(createDefaultWorkspaceFile(workspaceFile, '/workspace'));
    registerFileSystemOverlay(1, fileSystemProvider);

    return {
        wrapperConfig,
        workspaceFile,
        helloTsUri,
        testerTsUri
    };
};
