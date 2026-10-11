import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {validateContent,mergeContent} from '../src/content.mjs';import {googleFormUrl} from '../src/kits.mjs';import {syncForm} from '../src/form-sync.mjs';
const defaults=JSON.parse(fs.readFileSync('src/default-content.json'));
test('kits require safe published forms, complete visible cards and valid capacities',()=>{
 const c=structuredClone(defaults);c.kits=[{id:'kit-one',title:'Science',description:'',price:'NT$500',formUrl:'https://docs.google.com/forms/d/e/example/viewform',photo:c.photos.hero,responseLimit:4,visible:true,soldOut:false}];
 assert.equal(validateContent(c).kits[0].responseLimit,4);
 for(const value of [0,-1,2.5,100001]){c.kits[0].responseLimit=value;assert.throws(()=>validateContent(c));}
 c.kits[0].responseLimit=null;c.kits[0].photo=null;assert.throws(()=>validateContent(c));c.kits[0].visible=false;assert.equal(validateContent(c).kits[0].photo,null);
 assert.equal(googleFormUrl('https://user:pass@docs.google.com/forms/d/e/example/viewform'),null);assert.equal(googleFormUrl('https://docs.google.com/forms/d/example/edit'),null);assert.equal(googleFormUrl('https://evil.example/forms/d/e/example/viewform'),null);
 assert.deepEqual(mergeContent({...defaults,kits:undefined}).kits,[]);
});
test('unconfigured form sync fails closed',async()=>{assert.equal((await syncForm(new Request('https://test/api/forms/sync',{method:'POST',body:'{}'}),{},defaults)).status,503);});
