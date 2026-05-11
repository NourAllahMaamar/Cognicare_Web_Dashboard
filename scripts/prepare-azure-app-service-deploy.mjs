import { copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const distDir = resolve(root, 'dist');

const packageJson = {
  name: 'cognicare-web-dashboard-deploy',
  private: true,
  version: '1.0.0',
  type: 'module',
  scripts: {
    start: 'node server.js',
  },
  engines: {
    node: '20.x',
  },
};

const serverJs = `import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 8080);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.apk': 'application/vnd.android.package-archive',
};

function resolveAsset(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const normalizedPath = normalize(decodedPath).replace(/^([.][.][/\\\\])+/, '');
  const candidate = resolve(join(root, normalizedPath === '/' ? 'index.html' : normalizedPath.slice(1)));

  if (!candidate.startsWith(root)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;

  return join(root, 'index.html');
}

createServer((req, res) => {
  const filePath = resolveAsset(req.url || '/');

  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = extname(filePath).toLowerCase();
  res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');

  if (ext === '.apk') {
    res.setHeader('Content-Disposition', \`attachment; filename="\${filePath.split('/').pop()}"\`);
  }

  createReadStream(filePath)
    .on('error', () => {
      res.writeHead(500);
      res.end('Server error');
    })
    .pipe(res);
}).listen(port, () => {
  console.log(\`CogniCare web dashboard listening on port \${port}\`);
});
`;

await writeFile(resolve(distDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
await writeFile(resolve(distDir, 'server.js'), serverJs);
await copyFile(resolve(root, 'public', 'mobile-release.json'), resolve(distDir, 'mobile-release.json'));

console.log('Prepared Azure App Service deployment files in dist/.');
