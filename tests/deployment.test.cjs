const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('HTML assets resolve within the GitHub Pages repository path',()=>{
  const html=fs.readFileSync('index.html','utf8');
  const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
  for(const ref of refs){
    if(ref==='./')continue;
    const url=new URL(ref,'https://example.github.io/malssum/');
    assert.ok(url.pathname.startsWith('/malssum/public/'),ref);
    assert.ok(fs.existsSync(path.resolve(ref)),ref);
  }
  const manifest=JSON.parse(fs.readFileSync('public/manifest.webmanifest','utf8'));
  const base='https://example.github.io/malssum/public/manifest.webmanifest';
  assert.equal(new URL(manifest.start_url,base).pathname,'/malssum/');
  assert.equal(new URL(manifest.scope,base).pathname,'/malssum/');
  for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join('public',icon.src)));
});
