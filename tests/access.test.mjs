import {test} from 'node:test';import assert from 'node:assert/strict';import {generateKeyPair,SignJWT} from 'jose';import {editorIdentity} from '../src/access.mjs';
const {privateKey,publicKey}=await generateKeyPair('RS256'),env={ACCESS_ISSUER:'https://test.cloudflareaccess.com',ACCESS_AUD:'app',EDITOR_EMAILS:'owner@example.com,company@example.com'};
const sign=(claims={},options={})=>new SignJWT({email:'owner@example.com',type:'app',...claims}).setProtectedHeader({alg:'RS256'}).setSubject('user').setIssuer(options.issuer||env.ACCESS_ISSUER).setAudience(options.audience||'app').setIssuedAt().setExpirationTime(options.expires||'1h').sign(options.key||privateKey);
const req=token=>new Request('https://example.com/admin',{headers:token?{'Cf-Access-Jwt-Assertion':token}:{}});
test('signed Access identity requires correct signature, issuer, audience, expiry and editor email',async()=>{
 assert.equal((await editorIdentity(req(await sign()),env,publicKey)).email,'owner@example.com');
 assert.equal((await editorIdentity(req(await sign({email:'COMPANY@example.com'})),env,publicKey)).email,'company@example.com');
 for(const token of [await sign({email:'other@example.com'}),await sign({type:'service'}),await sign({}, {audience:'other'}),await sign({}, {issuer:'https://evil.example'}),await sign({}, {expires:'-1h'}),await sign({}, {key:(await generateKeyPair('RS256')).privateKey}),'garbage'])assert.equal(await editorIdentity(req(token),env,publicKey),null);
});
test('unsigned identity headers and missing Access configuration fail closed',async()=>{
 const spoof=new Request('https://example.com/admin',{headers:{'Cf-Access-Authenticated-User-Email':'owner@example.com','oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.com'}});
 assert.equal(await editorIdentity(spoof,env,publicKey),null);assert.equal(await editorIdentity(req(await sign()),{},publicKey),null);
 assert.equal(await editorIdentity(req(await sign()),{...env,ACCESS_ISSUER:'https://test.cloudflareaccess.com.evil.test'},publicKey),null);
});
test('signed Access cookie works for protected draft and image routes',async()=>{const token=await sign();const request=new Request('https://example.com/?preview=draft',{headers:{cookie:'CF_Authorization='+token}});assert.equal((await editorIdentity(request,env,publicKey)).email,'owner@example.com');});
