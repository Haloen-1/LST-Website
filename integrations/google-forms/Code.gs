/** Prepare only. Install after the owner approves the staging connection. */
function lstConfig(){
 const p=PropertiesService.getScriptProperties(),url=p.getProperty('LST_SYNC_URL'),secret=p.getProperty('LST_SYNC_SECRET'),forms=JSON.parse(p.getProperty('LST_FORMS')||'[]');
 if(!/^https:\/\/[^/?#]+\/api\/forms\/sync$/.test(url||'')||!secret||secret.length<32||!Array.isArray(forms)||!forms.length)throw Error('Set the endpoint, secret and form mappings in Script Properties first.');
 const ids=new Set();for(const f of forms){if(!['kit','event'].includes(f.type)||!/^[-a-z0-9]{1,80}$/.test(f.id)||!/^[-\w]+$/.test(f.formId)||ids.has(f.formId))throw Error('Use one distinct form per kit/event, with valid IDs.');ids.add(f.formId);}return {url,secret,forms};
}
function lstSyncOne(config,item){
 const form=FormApp.openById(item.formId);
 const payload={type:item.type,id:item.id,formUrl:form.getPublishedUrl(),count:form.getResponses().length,accepting:form.isAcceptingResponses(),observedAt:Date.now()};
 const body=JSON.stringify(payload),signature=Utilities.computeHmacSha256Signature(body,config.secret,Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
 const response=UrlFetchApp.fetch(config.url,{method:'post',contentType:'application/json',payload:body,headers:{'X-LST-Signature':signature},muteHttpExceptions:true,followRedirects:false});
 if(response.getResponseCode()!==200)throw Error('Sync failed for '+item.type+':'+item.id+' (HTTP '+response.getResponseCode()+'). Check the website mapping and secret.');
 const result=JSON.parse(response.getContentText());
 if(result.closed===true&&payload.accepting){form.setCustomClosedFormMessage(item.type==='kit'?'Out of stock / 已售完':'Registration closed / 報名已截止');form.setAcceptingResponses(false);}
 // Never reopen a manually closed form. No response answers or email addresses leave Google.
}
function lstSyncAll(){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{const config=lstConfig(),failed=[];for(const item of config.forms){try{lstSyncOne(config,item);}catch(e){failed.push(e.message);}}if(failed.length)throw Error(failed.join('\n'));}finally{lock.releaseLock();}
}
function lstOnSubmit(event){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{const config=lstConfig(),item=config.forms.find(f=>f.formId===event.source.getId());if(item)lstSyncOne(config,item);}finally{lock.releaseLock();}
}
function lstInstallTriggers(){
 const config=lstConfig();
 // Replace only this integration's triggers; leave other scripts' handlers alone.
 for(const trigger of ScriptApp.getProjectTriggers())if(['lstOnSubmit','lstSyncAll'].includes(trigger.getHandlerFunction()))ScriptApp.deleteTrigger(trigger);
 for(const item of config.forms)ScriptApp.newTrigger('lstOnSubmit').forForm(FormApp.openById(item.formId)).onFormSubmit().create();
 ScriptApp.newTrigger('lstSyncAll').timeBased().everyMinutes(5).create();lstSyncAll();
}
