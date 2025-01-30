import { IDisposable } from "monaco-editor";

export function toDisposable(dispose: () => void): IDisposable {
	return { dispose };
}
export function toLocalISOString(date: Date): string {
	return date.getFullYear() +
		'-' + String(date.getMonth() + 1).padStart(2, '0') +
		'-' + String(date.getDate()).padStart(2, '0') +
		'T' + String(date.getHours()).padStart(2, '0') +
		':' + String(date.getMinutes()).padStart(2, '0') +
		':' + String(date.getSeconds()).padStart(2, '0') +
		'.' + (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
		'Z';
}

const encoder = new TextEncoder()
export function encode(str: string): Uint8Array {
	return encoder.encode(str)
}

