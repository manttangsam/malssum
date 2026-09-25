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
    assert.ok(fs.existsSync(path.resolve(ref.split('?')[0])),ref);
  }
  const manifest=JSON.parse(fs.readFileSync('public/manifest.webmanifest','utf8'));
  const base='https://example.github.io/malssum/public/manifest.webmanifest';
  assert.equal(new URL(manifest.start_url,base).pathname,'/malssum/');
  assert.equal(new URL(manifest.scope,base).pathname,'/malssum/');
  for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join('public',icon.src)));
});


test('release version matches loaded reader and cache-busting script/style URLs',()=>{
  const version=JSON.parse(fs.readFileSync('public/version.json','utf8')).version;
  const reader=fs.readFileSync('public/reader.js','utf8');
  assert.ok(reader.includes(`const APP_VERSION = '${version}'`));
  const html=fs.readFileSync('index.html','utf8');
  const assets=[...html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css)[^"]*)"/g)];
  assert.ok(assets.length>=5);
  for(const [,ref] of assets)assert.equal(new URL(ref,'https://example.github.io/malssum/').searchParams.get('v'),version);
});
