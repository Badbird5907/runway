import * as vscode from 'vscode';
import { Logger } from 'monaco-languageclient/tools';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import { IStoredWorkspace } from '@codingame/monaco-vscode-configuration-service-override';

export const disableButton = (id: string, disabled: boolean) => {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (button !== null) {
        button.disabled = disabled;
    }
};

export const configureMonacoWorkers = (logger?: Logger) => {
    // this is not a react hook
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useWorkerFactory({
        workerOverrides: {
            ignoreMapping: true,
            workerLoaders: {
                TextEditorWorker: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
                TextMateWorker: () => new Worker(new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url), { type: 'module' })
            }
        },
        logger
    });
};

export const createDefaultWorkspaceFile = (workspaceFile: vscode.Uri, workspacePath: string) => {
    return new RegisteredMemoryFile(
        workspaceFile,
        JSON.stringify(
            <IStoredWorkspace>{
                folders: [
                    {
                        path: workspacePath
                    }
                ]
            },
            null,
            2
        )
    );
};
