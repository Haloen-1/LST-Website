import {test} from 'node:test';import assert from 'node:assert/strict';
import {defaults,mergeContent,validateContent} from '../src/content.mjs';
import {renderHeader} from '../src/header.mjs';import {renderTimeline} from '../src/extended-content.mjs';
test('header edits survive storage, preserve legacy content and reject unsafe links',()=>{
 const c=structuredClone(defaults);c.navigation=[{label:'Learn',url:'/events',children:[{label:'Register',url:'https://docs.google.com/forms/example'}]}];
 c.text.headerBrand='Our science club';assert.equal(mergeContent(validateContent(c)).navigation[0].label,'Learn');assert.match(renderHeader(c),/Our science club/);
 c.navigation[0].children[0].url='javascript:alert(1)';assert.throws(()=>validateContent(c),/safe link/);
 const legacy=structuredClone(defaults);delete legacy.navigation;delete legacy.text.headerBrand;assert.ok(mergeContent(legacy).navigation.length);assert.equal(mergeContent(legacy).text.headerBrand,defaults.text.headerBrand);
});
test('timeline action wording is editable and old bilingual enquiry copy is cleaned',()=>{
 const c=structuredClone(defaults);c.text.lessonDetailsLabel='Explore this lesson';assert.match(renderTimeline(c),/Explore this lesson/);assert.doesNotMatch(renderTimeline(c),/Read lesson &amp; details/);
 c.text.formTitle='Workshop enquiries & updates / 活動洽詢與最新消息';assert.equal(validateContent(c).text.formTitle,'Workshop enquiries & updates');
});
