import { cp, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// The shipped app is static HTML with classic scripts, independent of src/.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
await mkdir(output, { recursive: true });
await copyFile(resolve(root, 'index.html'), resolve(output, 'index.html'));
await cp(resolve(root, 'public'), resolve(output, 'public'), { recursive: true });
console.log('Built static app in dist/ (supports repository subpaths).');
