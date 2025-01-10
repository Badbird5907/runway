import fs from 'fs';
import path from 'path';

const cwd = process.cwd();

// delete public/extensions/*
fs.rmSync(path.join(cwd, 'public/extensions'), { recursive: true, force: true });

// create public/extensions/memfs
fs.mkdirSync(path.join(cwd, 'public/extensions/memfs/dist/web'), { recursive: true });


const links = {
  extensions: {
    "memfs": { // extensions/memfs
      "package.json": "public/extensions/memfs/package.json", // only link the package.json file
      "dist/web/extension.js": "public/extensions/memfs/dist/web/extension.js" // only link the extension.js file
    }
  },
  node_modules: {
    "vscode-web": { // node_modules/vscode-web
      dist: "public/vscode/dist" // link the entire dist folder to public/vscode/dist
    }
  }
}

function processLinks(linkConfig, basePath = '') {
  Object.entries(linkConfig).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const sourcePath = path.join(basePath, key);
      const absoluteSource = path.join(cwd, sourcePath);
      const absoluteTarget = path.join(cwd, value);

      // Ensure target directory exists
      fs.mkdirSync(path.dirname(absoluteTarget), { recursive: true });
      
      // Create symlink with appropriate type based on source
      try {
        console.log(`Creating symlink from ${absoluteSource} to ${absoluteTarget}`);
        const symlinkType = fs.statSync(absoluteSource).isDirectory() ? 'junction' : 'file';
        fs.symlinkSync(absoluteSource, absoluteTarget, symlinkType);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.error(`Failed to create symlink from ${sourcePath} to ${value}:`, error);
        }
      }
    } else if (typeof value === 'object') {
      // Recurse into nested objects
      processLinks(value, path.join(basePath, key));
    }
  });
}
processLinks(links);