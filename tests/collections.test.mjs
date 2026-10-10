import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeMap,eventStatus,renderFaqs,renderGallery} from '../src/collections.mjs';
import {defaults,mergeContent,validateContent} from '../src/content.mjs';
test('Google Maps HTML keeps only a validated embed URL',()=>{
 assert.equal(normalizeMap('<iframe src="https://www.google.com/maps/embed?pb=abc&amp;x=1" onload="alert(1)"></iframe>'),'https://www.google.com/maps/embed?pb=abc&x=1');
 for(const value of ['https://evil.example/maps/embed','https://www.google.com.evil.example/maps/embed','javascript:alert(1)','<script>alert(1)</script>','https://user:password@www.google.com/maps/embed','https://www.google.com/search?q=hello'])assert.throws(()=>normalizeMap(value));
});
test('automatic event status changes after the event ends in Taipei',()=>{
 const event={status:'auto',startDate:'2026-09-22',endDate:'2026-09-23'};
 assert.equal(eventStatus(event,new Date('2026-09-23T15:59:00Z')),'upcoming');
 assert.equal(eventStatus(event,new Date('2026-09-23T16:00:00Z')),'past');
});
test('legacy saved content gains collections without losing owner text or photos',()=>{
 const old={text:{heroTitle:'My heading',faqQuestion1:'My question',faqAnswer1:'My answer'},photos:{hero:{...defaults.photos.hero,alt:'My alt text'}}};const merged=mergeContent(old);
 assert.equal(merged.text.heroTitle,'My heading');assert.equal(merged.faqs[0].question,'My question');assert.equal(merged.photos.hero.alt,'My alt text');assert.equal(merged.events.length,1);assert.equal(merged.gallery.length,3);assert.doesNotThrow(()=>validateContent(merged));
});
test('collection content is escaped, identifiers unique, and incomplete public events rejected',()=>{
 const content=structuredClone(defaults);content.faqs[0].question='<img src=x onerror=alert(1)>';content.gallery[0].caption='<script>evil()</script>';assert.ok(!renderFaqs(content).includes('<img'));assert.ok(!renderGallery(content,false).includes('<script>'));
 content.events.push({...content.events[0]});assert.throws(()=>validateContent(content),/duplicate/);content.events.pop();content.events[0].startDate='';assert.throws(()=>validateContent(content),/start date/);content.events[0].visible=false;assert.doesNotThrow(()=>validateContent(content));
});
