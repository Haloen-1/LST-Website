import {createRemoteJWKSet,jwtVerify} from 'jose';

const keySets=new Map();
export function accessConfig(env){
 const issuer=String(env.ACCESS_ISSUER||'').replace(/\/$/,'');
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)||!env.ACCESS_AUD)return null;
 const allowed=[env.EDITOR_EMAIL,...String(env.EDITOR_EMAILS||'').split(',')].filter(Boolean).map(v=>v.trim().toLowerCase()).filter(Boolean);
 return allowed.length?{issuer,audience:env.ACCESS_AUD,allowed}:null;
}
// Never trust identity headers alone, including the former Sites headers.
export async function editorIdentity(request,env,keyResolver){
 const config=accessConfig(env);if(!config)return null;
 const token=request.headers.get('Cf-Access-Jwt-Assertion')||request.headers.get('cookie')?.match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1];
 if(!token||token.length>16384)return null;
 try{
  let keys=keyResolver;
  if(!keys){if(!keySets.has(config.issuer))keySets.set(config.issuer,createRemoteJWKSet(new URL(config.issuer+'/cdn-cgi/access/certs'),{timeoutDuration:5000,cooldownDuration:30000}));keys=keySets.get(config.issuer);}
  const {payload}=await jwtVerify(token,keys,{issuer:config.issuer,audience:config.audience,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email'],clockTolerance:5});
  if(typeof payload.sub!=='string'||!payload.sub||typeof payload.email!=='string'||payload.type!=='app'||!Number.isFinite(payload.iat)||payload.iat>Date.now()/1000+5)return null;
  const email=payload.email.trim().toLowerCase();return config.allowed.includes(email)?{id:payload.sub,email}:null;
 }catch{return null;}
}
