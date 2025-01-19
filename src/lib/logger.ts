/* eslint-disable @typescript-eslint/no-explicit-any */
/// https://github.com/Vendicated/Vencord/blob/main/src/utils/Logger.ts
const IS_REPORTER = false;
const IS_WEB = false;

export class Logger {
  name: string;
  color: string;
    /**
     * Returns the console format args for a title with the specified background colour and black text
     * @param {string} color - Background colour
     * @param {string} title - Text
     * @returns {[string, ...string[]]} Array to be destructured into console.log or errorCustomFmt
     *
     * @example logger.errorCustomFmt(...Logger.makeTitle("white", "Hello"), "World");
     */
    static makeTitle(color: string, title: string) {
        return ["%c %c %s ", "", `background: ${color}; color: black; font-weight: bold; border-radius: 5px;`, title];
    }

    /**
     * Create a new Logger instance
     * @param {string} name - Name of the logger
     * @param {string} [color='white'] - Color for the logger
     */
    constructor(name: string, color = "white") {
        this.name = name;
        this.color = color;
    }

    /**
     * Internal log method
     * @param {string} level - Console log level
     * @param {string} levelColor - Color for the log level
     * @param {any[]} args - Arguments to log
     * @param {string} [customFmt=''] - Custom format string
     */
    _log(level: keyof Console, levelColor: string, args: any[], customFmt = "") {
        if (IS_REPORTER && IS_WEB) {
            (console[level] as (...args: any[]) => void)("[Runway]", this.name + ":", ...args);
            return;
        }
        (console[level] as (...args: any[]) => void)(
            `%c Runway %c %c ${this.name} ${customFmt}`,
            `background: ${levelColor}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${this.color}; color: black; font-weight: bold; border-radius: 5px;`,
            ...args
        );
    }

    /**
     * Log a message
     * @param {...any} args - Arguments to log
     */
    log(...args: any[]) {
        this._log("log", "#a6d189", args);
    }

    /**
     * Log an info message
     * @param {...any} args - Arguments to log
     */
    info(...args: any[]) {
        this._log("info", "#a6d189", args);
    }

    /**
     * Log an error message
     * @param {...any} args - Arguments to log
     */
    error(...args: any[]) {
        this._log("error", "#e78284", args);
    }

    /**
     * Log an error message with custom formatting
     * @param {string} fmt - Custom format string
     * @param {...any} args - Arguments to log
     */
    errorCustomFmt(fmt: string, ...args: any[]) {
        this._log("error", "#e78284", args, fmt);
    }

    /**
     * Log a warning message
     * @param {...any} args - Arguments to log
     */
    warn(...args: any[]) {
        this._log("warn", "#e5c890", args);
    }

    /**
     * Log a debug message
     * @param {...any} args - Arguments to log
     */
    debug(...args: any[]) {
        this._log("debug", "#eebebe", args);
    }
}

export const logger = new Logger("Runway", "#4175d2");