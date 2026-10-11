import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

export function checkStaging(config){
 const failures=[];
 const require=(condition,message)=>{if(!condition)failures.push(message);};
 const vars=config.vars||{},assets=config.assets||{};
 require(config.name==='little-scientists-staging','Use the separate little-scientists-staging Worker.');
 require(config.workers_dev===true&&config.preview_urls===false,'Enable workers.dev and disable version preview URLs.');
 require(Array.isArray(config.routes)&&config.routes.length===0&&!config.route&&!config.zone_id,'No domain routes or zone IDs are permitted.');
 require(!config.env&&!config.r2_buckets&&!config.services&&!config.dispatch_namespaces,'Do not add alternate environments, R2, or service bindings.');
 require(config.main==='dist/server/index.js','Use the built Worker entry point.');
 require(vars.STAGING==='true','Staging must remain noindex.');
 require(/^https:\/\/little-scientists-staging\.[a-z0-9-]+\.workers\.dev$/.test(vars.PUBLIC_ORIGIN||''),'Set the exact staging workers.dev origin.');
 require(!vars.PUBLIC_ORIGINS,'Do not allow additional public origins on staging.');
 if(vars.ADMIN_DISABLED==='true'){
  require(!vars.ACCESS_ISSUER&&!vars.ACCESS_AUD,'Locked staging must omit Access credentials.');
 }else{
  require(/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(vars.ACCESS_ISSUER||''),'Set the Cloudflare Access team issuer.');
  require(/^[a-f0-9]{64}$/i.test(vars.ACCESS_AUD||''),'Set the Access application audience tag.');
 }
 require(typeof vars.EDITOR_EMAILS==='string'&&vars.EDITOR_EMAILS.split(',').every(s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())),'Set an explicit approved editor email list.');
 require(assets.directory==='./dist/assets'&&assets.binding==='ASSETS'&&assets.html_handling==='none'&&assets.not_found_handling==='none','Preserve Static Assets routing and disable HTML fallback.');
 require(assets.run_worker_first===true||['/admin*','/api/*','/media/*','/robots.txt','/sitemap.xml'].every(p=>assets.run_worker_first?.includes(p)),'Protected paths must reach the Worker before Static Assets.');
 const db=config.d1_databases?.[0],kv=config.kv_namespaces?.[0];
 require(config.d1_databases?.length===1&&db?.binding==='DB'&&db?.database_name==='little-scientists-staging'&&db?.migrations_dir==='drizzle'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(db?.database_id||'')&&!/^00000000-/.test(db.database_id),'Set a real, separate staging D1 database ID.');
 require(config.kv_namespaces?.length===1&&kv?.binding==='PHOTOS'&&/^[a-f0-9]{32}$/i.test(kv?.id||'')&&!/^0{24}/.test(kv.id),'Set a real, separate staging photo KV namespace ID.');
 require(!/REPLACE_WITH|YOUR-TEAM|YOUR-SUBDOMAIN|approved-editor@example/i.test(JSON.stringify(config)),'Replace all example values.');
 return failures;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const config=JSON.parse(fs.readFileSync(process.argv[2]||'wrangler.staging.json','utf8'));
  const failures=checkStaging(config);
  if(failures.length)throw Error(failures.join('\n'));
  console.log('Staging configuration passed local checks. Resource ownership, Free plans, Access policy, and deployment approval still require verification. No remote action performed.');
 }catch(error){console.error('Staging configuration not ready:\n'+error.message);process.exitCode=1;}
}
