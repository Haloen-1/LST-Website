import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHmac} from 'node:crypto';
test('Apps Script sends only signed aggregate data and closes forms at capacity',()=>{
 let accepting=true,closedMessage='',calls=[];const secret='test-only-not-a-real-secret-1234567890';const config={url:'https://staging.example/api/forms/sync',secret};
 const form={getPublishedUrl:()=> 'https://docs.google.com/forms/d/e/demo/viewform',getResponses:()=>[{privateEmail:'never-sent@example.test'},{name:'Never sent'}],isAcceptingResponses:()=>accepting,setCustomClosedFormMessage:v=>closedMessage=v,setAcceptingResponses:v=>accepting=v};
 const context={FormApp:{openById:()=>form},Utilities:{Charset:{UTF_8:'utf8'},computeHmacSha256Signature:(body,key)=>[...createHmac('sha256',key).update(body).digest()]},UrlFetchApp:{fetch:(url,options)=>{calls.push(options);assert.equal(url,config.url);return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({closed:true,limit:2})};}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('integrations/google-forms/Code.gs','utf8'),context);context.lstSyncOne(config,{type:'kit',id:'test-kit',formId:'form'});
 assert.equal(accepting,false);assert.match(closedMessage,/Out of stock/);const sent=JSON.parse(calls[0].payload);assert.equal(sent.count,2);assert.ok(!calls[0].payload.includes('never-sent'));assert.equal(calls[0].headers['X-LST-Signature'],createHmac('sha256',secret).update(calls[0].payload).digest('hex'));
 context.lstSyncOne(config,{type:'kit',id:'test-kit',formId:'form'});assert.equal(JSON.parse(calls[1].payload).accepting,false);
});
