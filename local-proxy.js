const http = require('http');
const { execSync } = require('child_process');

const PORT = 7788;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/accounts') {
    try {
      const output = execSync(
        'cmd.exe /c "lark-cli sheets +read --spreadsheet-token YkBsspUJ9hKLKgtkJVOcVfXwn6f --sheet-id e041cf --range e041cf!A1:E50"',
        { encoding: 'utf8', timeout: 30000 }
      );
      const json = JSON.parse(output);
      const rows = json?.data?.valueRange?.values || [];
      const accounts = rows.slice(1).filter(r => r[0]).map(r => ({
        name: r[0] || '',
        appid: r[1] || '',
        appsecret: r[2] || '',
        template: r[3] || 'ganhuo',
        mediaId: r[4] || ''
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, accounts }));
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`local-proxy running at http://localhost:${PORT}`);
  console.log('GET /accounts — 读取飞书表格账号');
});