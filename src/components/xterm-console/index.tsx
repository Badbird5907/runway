import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { useEffect, createContext, useRef } from "react";

import { ResizablePanel } from "@/components/ui/resizable";

import "@xterm/xterm/css/xterm.css";
import "@/components/xterm-console/index.css";
import { useWebContainer } from "@/components/container";

export const TerminalStateProvider = createContext<{
  resize: () => void;
}>({
  resize: () => {},
});

const XTermConsole = () => {
  const termRef = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal>(
    new Terminal({
      convertEol: true,
      theme: {
        foreground: "#F8F8F8",
        selectionBackground: "#5DA5D533",
        selectionInactiveBackground: "#555555AA",
        black: "#1E1E1D",
        brightBlack: "#262625",
        red: "#CE5C5C",
        brightRed: "#FF7272",
        green: "#5BCC5B",
        brightGreen: "#72FF72",
        yellow: "#CCCC5B",
        brightYellow: "#FFFF72",
        blue: "#5D5DD3",
        brightBlue: "#7279FF",
        magenta: "#BC5ED1",
        brightMagenta: "#E572FF",
        cyan: "#5DA5D5",
        brightCyan: "#72F0FF",
        white: "#F8F8F8",
        brightWhite: "#FFFFFF",
      },
    }),
  );
  const fitAddon = useRef<FitAddon>(new FitAddon());
  const { status, shellProcess, addListener, removeListener } = useWebContainer();
  useEffect(() => {
    term.current.write(`[WebContainer] ${status}\n`);
  }, [status])

  const resize = () => {
    fitAddon.current.fit();
    if (shellProcess) {
      shellProcess.resize({
        cols: term.current.cols,
        rows: term.current.rows,
      });
    }
  }

  useEffect(() => {
    if (termRef.current) {
      const terminal = term.current;
      terminal.loadAddon(fitAddon.current);
      terminal.loadAddon(new WebLinksAddon());
      terminal.open(termRef.current);
      fitAddon.current.fit();

      // terminal.attachCustomKeyEventHandler((e) => {
      //   const termCfg = useConfig.getState().terminal;
      //   if (e.key === "c" && e.ctrlKey && termCfg.overrideCtrlC) {
      //     const selection = terminal.getSelection();
      //     if (selection) {
      //       navigator.clipboard.writeText(selection);
      //     } else {
      //       interruptExecution();
      //     }
      //     return false;
      //   } else if (e.key === "v" && e.ctrlKey && termCfg.overrideCtrlV) {
      //     /*navigator.clipboard.readText().then((text) => {
      //       terminal.write(text);
      //     });*/
      //     return false; // returning false will allow the default action to occur (paste)
      //   }
      //   return true;
      // });

      // window.term = terminal;
    }
  }, [termRef]);

  useEffect(() => {
    const shellOutputListenerId = addListener('shell-output', (data) => {
      term.current.write(data);
    });

    return () => {
      removeListener('shell-output', shellOutputListenerId);
    }
 }, [addListener, removeListener, shellProcess]);

 useEffect(() => {
  if (shellProcess) {
    if (shellProcess.input.locked) {
      term.current.write("Input is locked\n");
      return;
    }
    const input = shellProcess.input.getWriter();
    resize();
    const disposable = term.current.onData((data) => {
      input.write(data);
    });
    return () => {
      disposable.dispose();
      input.close();
    }
  }
 }, [shellProcess])

  return (
    <ResizablePanel
      defaultSize={30}
      onResize={resize}
      className="h-full"
    >
      <div id="terminal" ref={termRef} className={"w-full h-full"}></div>
    </ResizablePanel>
  );
};
export default XTermConsole;