import {Miniflare,createFetchMock,Log,LogLevel} from 'miniflare';import {generateKeyPair,exportJWK,SignJWT} from 'jose';import fs from 'node:fs';
export async function harness(){
 const issuer='https://lst-test.cloudflareaccess.com',audience='local-test-app',email='owner@local.test';
 const {privateKey,publicKey}=await generateKeyPair('RS256');const jwk={...await exportJWK(publicKey),kid:'test-key',alg:'RS256',use:'sig'};
 const mock=createFetchMock();mock.disableNetConnect();mock.get(issuer).intercept({method:'GET',path:'/cdn-cgi/access/certs'}).reply(200,JSON.stringify({keys:[jwk]}),{headers:{'Content-Type':'application/json'}}).persist();
 const config=JSON.parse(fs.readFileSync('wrangler.json'));
 const mf=new Miniflare({modules:true,scriptPath:'dist/server/index.js',compatibilityDate:config.compatibility_date,cf:false,log:new Log(LogLevel.ERROR),d1Databases:['DB'],kvNamespaces:['PHOTOS'],bindings:{PUBLIC_ORIGIN:'https://staging.example',STAGING:'true',ACCESS_ISSUER:issuer,ACCESS_AUD:audience,EDITOR_EMAILS:email},fetchMock:mock,assets:{directory:'dist/assets',binding:'ASSETS',assetConfig:{html_handling:'none',not_found_handling:'none'},routerConfig:{has_user_worker:true,static_routing:{user_worker:config.assets.run_worker_first}}}});
 const db=await mf.getD1Database('DB');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()){const sql=fs.readFileSync('drizzle/'+file,'utf8').replaceAll('--> statement-breakpoint','');for(const stmt of sql.split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(stmt).run();}
 const token=await new SignJWT({email,type:'app'}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(issuer).setAudience(audience).setSubject('local-editor').setIssuedAt().setExpirationTime('10m').sign(privateKey);
 const headers={'Cf-Access-Jwt-Assertion':token,Origin:'https://staging.example','X-LST-Editor':'1'};
 const request=(path,options={})=>mf.dispatchFetch('https://staging.example'+path,options);
 const post=(path,data,extra={})=>request(path,{method:'POST',headers:{...headers,'Content-Type':'application/json',...extra},body:JSON.stringify(data)});
 return {mf,db,headers,request,post,token};
}
