import {test} from 'node:test';import assert from 'node:assert/strict';
import {defaults,fields,validateContent,validLink,gmailLink,jpegDimensions,escapeHtml} from '../src/content.mjs';
test('all editable defaults round-trip and preserve distinct content fields',()=>{const result=validateContent(defaults);assert.deepEqual(result,defaults);assert.equal(new Set(fields.map(f=>f.key)).size,fields.length);});
test('external forms and internal routes accepted; unsafe schemes and credentials rejected',()=>{
 for(const url of ['https://forms.gle/abc','https://docs.google.com/forms/d/e/example/viewform','https://www.surveymonkey.com/r/example','/workshops','#programs'])assert.equal(validLink(url),true,url);
 for(const url of ['javascript:alert(1)','data:text/html,bad','//evil.com','/\\evil.com','/x%5cevil','http://example.com','https://user:pass@example.com','https://example.com\n'])assert.equal(validLink(url),false,url);
});
test('HTML is escaped as text and unpublished photo references are constrained',()=>{const c=structuredClone(defaults);c.text.heroTitle='<script>alert(1)</script>';assert.match(escapeHtml(validateContent(c).text.heroTitle),/^&lt;script&gt;/);c.photos.hero.src='https://example.com/private.jpg';assert.throws(()=>validateContent(c),/valid uploaded photo/);});
test('invalid fields fail before publishing',()=>{const c=structuredClone(defaults);c.text.heroTitle='';assert.throws(()=>validateContent(c),/cannot be empty/);c.text.heroTitle=defaults.text.heroTitle;c.contact.email='not-an-email';assert.throws(()=>validateContent(c),/email/);});
test('Gmail links encode recipient and subject without sending anything',()=>{const url=new URL(gmailLink('hello+test@example.com','Partnership & science'));assert.equal(url.hostname,'mail.google.com');assert.equal(url.searchParams.get('to'),'hello+test@example.com');assert.equal(url.searchParams.get('su'),'Partnership & science');});
test('non-JPEG uploads are rejected by signature',()=>{assert.equal(jpegDimensions(new TextEncoder().encode('<svg onload="alert(1)"></svg>')),null);assert.equal(jpegDimensions(new Uint8Array(100)),null);});
