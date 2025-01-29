import { bootWebContainer, getWebContainer } from '@/webcontainer'
import {
  ITerminalChildProcess,
  SimpleTerminalBackend,
  SimpleTerminalProcess
} from '@codingame/monaco-vscode-terminal-service-override'
import { WebContainerProcess } from '@webcontainer/api'
import ansiColors from 'ansi-colors'
import * as vscode from 'vscode'

export class TerminalBackend extends SimpleTerminalBackend {
  override getDefaultSystemShell = async (): Promise<string> => 'System'
  override createProcess = async (): Promise<ITerminalChildProcess> => {
    const dataEmitter = new vscode.EventEmitter<string>()
    const propertyEmitter = new vscode.EventEmitter<{
      type: string
      value: string
    }>()
    class TerminalProcess extends SimpleTerminalProcess {
      private process: WebContainerProcess | null = null
      private writer: WritableStreamDefaultWriter<string> | null = null
      
      async start(): Promise<undefined> {
        ansiColors.enabled = true
        console.log("starting process")
        dataEmitter.fire("Starting process...\n")
        try {
          this.process = await (await getWebContainer()).spawn("jsh", {
            terminal: {
              cols: 100,
              rows: 24
            },
            cwd: "/"
          })
        } catch (e) {
          console.error("error starting process", e)
          dataEmitter.fire("Error starting shell process\n")
          return undefined;
        }
        console.log("process started")
        this.process.output.pipeTo(
          new WritableStream({
            write(chunk) {
              dataEmitter.fire(chunk.toString())
            }
          })
        )
        this.writer = this.process.input.getWriter();

        return undefined
      }

      override onDidChangeProperty = propertyEmitter.event

      override shutdown(): void {
        this.process?.kill()
      }

      override input(data: string): void {
        if (!this.writer) {
          return
        }
        this.writer.write(data)
      }

      resize(cols: number, rows: number): void {
        this.process?.resize({ cols, rows })
      }

      override clearBuffer(): void | Promise<void> {
      }

      override updateProperty(): Promise<void> {
        console.log("updating property")
        propertyEmitter.fire({
          type: "cwd",
          value: "/home/workspace"
        })
        return Promise.resolve();
      }
    }
    return new TerminalProcess(1, 1, '/home/workspace', dataEmitter.event)
  }
}
