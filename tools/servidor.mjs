// Servidor local que reproduz o alojamento na Netlify: ficheiros estáticos e, para qualquer
// outro caminho, index.html (regra “/* /index.html 200” do netlify.toml).
// Uso: node tools/servidor.mjs [porta]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const porta = Number(process.argv[2] || process.env.PORT || 8080);
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let ficheiro = normalize(join(raiz, caminho));
  if (!ficheiro.startsWith(raiz)) { res.writeHead(403).end(); return; }
  try {
    const s = await stat(ficheiro);
    if (s.isDirectory()) ficheiro = join(ficheiro, 'index.html');
    const corpo = await readFile(ficheiro);
    res.writeHead(200, { 'Content-Type': tipos[extname(ficheiro)] || 'application/octet-stream' }).end(corpo);
  } catch {
    if (extname(caminho)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado'); return; }
    res.writeHead(200, { 'Content-Type': tipos['.html'] }).end(await readFile(join(raiz, 'index.html')));
  }
}).listen(porta, () => console.log(`Da Horta e do Forno em http://localhost:${porta}`));
