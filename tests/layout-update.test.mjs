import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,mergeContent,validateContent} from '../src/content.mjs';
import {renderTimeline,renderTestimonials,renderLocations,renderTeam} from '../src/extended-content.mjs';
import {allPhotos} from '../src/collections.mjs';
test('program timeline includes only visible lessons and events in the next 31 Taipei days',()=>{
 const c=structuredClone(defaults);c.events=[];c.timeline=[['past','2026-09-27'],['today','2026-09-28'],['next','2026-10-29'],['later','2026-10-30']].map(([id,date])=>({id,title:id,date,description:'Lesson',visible:true}));c.timeline.push({id:'hidden',title:'Hidden lesson',date:'2026-10-01',description:'Private',visible:false});
 const html=renderTimeline(c,false,true,new Date('2026-09-28T00:00:00Z'));assert.match(html,/milestone-today/);assert.match(html,/milestone-next/);assert.doesNotMatch(html,/milestone-past|milestone-later|Hidden lesson/);assert.match(renderTimeline(c),/milestone-past/);
});
test('new editor collections preserve published visibility and include the shared photo',()=>{
 const c=mergeContent({text:{heroTitle:'Owner headline'}});c.testimonials=[{id:'approved',quote:'A **great** workshop',name:'Parent',context:'Science camp',visible:true},{id:'private',quote:'Private review',name:'Draft',context:'',visible:false}];c.foundersPhoto={...defaults.photos.hero,alt:'Both founders'};const validated=validateContent(c);assert.match(renderTestimonials(validated),/<strong>great<\/strong>/);assert.doesNotMatch(renderTestimonials(validated),/Private review/);assert.match(renderTeam(validated),/Both founders/);assert.ok(allPhotos(validated).some(p=>p.alt==='Both founders'));assert.equal(validated.text.heroTitle,'Owner headline');
 c.foundersPhotoHeight=900;assert.throws(()=>validateContent(c),/height/);
});
test('unconfirmed locations stay out of served locations and testimonials are escaped',()=>{
 const c=structuredClone(defaults);c.timeline=[{visible:true,location:'Future school',planned:true},{visible:true,location:'Served school',planned:false},{visible:false,location:'Private school'}];const html=renderLocations(c);assert.match(html,/Served school/);assert.doesNotMatch(html,/Future school|Private school/);c.testimonials=[{quote:'<script>bad</script>',name:'<img>',context:'',visible:true}];assert.doesNotMatch(renderTestimonials(c),/<script>|<img>/);
});
