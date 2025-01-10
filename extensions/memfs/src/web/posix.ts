export class Posix {
  static basename(path: string, ext?: string) {
    if (path === undefined || path === null) {
      return '';
    }  
    if (path.length === 0) {
      return '';
    }
    path = path.replace(/[/\\]+$/, '');
  
    const parts = path.split(/[/\\]/); // last part of slash
    let base = parts[parts.length - 1] || '';
  
    if (ext) {
      if (base.slice(-ext.length) === ext) {
        base = base.slice(0, -ext.length);
      }
    }
  
    return base;
  }
  static dirname(path: string) {
    if (path === undefined || path === null) {
      return '.';
    }
    if (path.length === 0) {
      return '.';
    }
  
    path = path.replace(/[/\\]+$/, '');
  
    const lastSeparatorIndex = path.lastIndexOf('/');
    if (lastSeparatorIndex === -1) {
      return '.';
    }
    if (lastSeparatorIndex === 0) {
      return '/';
    }
    return path.slice(0, lastSeparatorIndex);
  }
}