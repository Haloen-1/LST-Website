import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
const root=process.cwd(),output=path.resolve(root,'dist');
if(output!==path.join(root,'dist')||path.dirname(output)!==root)throw Error('Invalid build output');
const assets={};
const types={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf','.txt':'text/plain;charset=utf-8','.xml':'application/xml'};
function collect(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,item.name);if(item.isDirectory())collect(file);else{const relative='/'+path.relative(path.join(root,'public'),file).replaceAll('\\','/');const ext=path.extname(file);const bytes=fs.readFileSync(file);assets[relative]={type:types[ext]??'application/octet-stream',...(['.html','.css','.js','.svg','.txt','.xml'].includes(ext)?{text:bytes.toString('utf8')}:{base64:bytes.toString('base64')})};}}}
collect(path.join(root,'public'));
fs.writeFileSync('src/generated-assets.mjs','export const assets = '+JSON.stringify(assets)+';');
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(path.join(output,'server'),{recursive:true});
await build({entryPoints:['src/worker.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:'dist/server/index.js'});
fs.mkdirSync('dist/.openai',{recursive:true});fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
if(fs.existsSync('drizzle'))fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Built Worker with',Object.keys(assets).length,'site assets.');
