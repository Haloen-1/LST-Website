import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,validateContent,mergeContent} from '../src/content.mjs';
import {localizedContent,languageFor,translate,interfaceDictionary} from '../src/localization.mjs';
import {renderTeam} from '../src/extended-content.mjs';
test('language uses explicit choice then cookie, preserving routes and identifiers',()=>{
 assert.equal(languageFor(new Request('https://example.com/events?lang=en',{headers:{cookie:'lst_language=zh'}})),'en');
 assert.equal(languageFor(new Request('https://example.com/events',{headers:{cookie:'lst_language=zh'}})),'zh');
 const c=structuredClone(defaults);c.translations={[c.text.heroTitle]:'自訂標題','Search':'找活動',Team:'團隊'};const zh=localizedContent(c,'zh');
 assert.equal(zh.text.heroTitle,'自訂標題');assert.equal(zh.links.googleForm,c.links.googleForm);assert.equal(zh.events[0].id,c.events[0].id);assert.equal(zh.team[0].founder,true);assert.equal(interfaceDictionary(c.translations).Search,'找活動');assert.equal(translate('constructor'),'constructor');
 assert.equal(validateContent(mergeContent(c)).translations[c.text.heroTitle],'自訂標題');
});
test('committee groups preserve owner order and hidden members stay private',()=>{
 const c=structuredClone(defaults);c.team.push({...c.team[0],id:'outreach',name:'Committee member',role:'Volunteer',committee:'Outreach',founder:false});c.team.push({...c.team[0],id:'hidden',name:'Hidden member',visible:false});const html=renderTeam(validateContent(c));assert.ok(html.indexOf('Co-founders')<html.indexOf('Outreach'));assert.ok(html.includes('Committee member'));assert.ok(!html.includes('Hidden member'));
});
