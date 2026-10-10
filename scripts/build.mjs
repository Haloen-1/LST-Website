import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
const root=process.cwd(),output=path.resolve(root,'dist');
if(output!==path.join(root,'dist')||path.dirname(output)!==root)throw Error('Invalid build output');
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(path.join(output,'server'),{recursive:true});fs.mkdirSync(path.join(output,'assets'),{recursive:true});
const assets={};
function collect(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,item.name);if(item.isDirectory())collect(file);else{const relative=path.relative(path.join(root,'public'),file).replaceAll('\\','/');if(relative.endsWith('.html')){assets['/'+relative]={text:fs.readFileSync(file,'utf8')};}else{const destination=path.join(output,'assets',relative);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(file,destination);}}}}
collect(path.join(root,'public'));
fs.writeFileSync('src/generated-assets.mjs','export const assets = '+JSON.stringify(assets)+';');
await build({entryPoints:['src/worker.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:'dist/server/index.js'});
console.log('Built Cloudflare Worker and Static Assets; no remote operation performed.');
