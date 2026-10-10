import {validateKits,responseLimit,googleFormUrl} from './kits.mjs';
import {richText,plainText} from '../public/formatting.js';
import {validateExtended} from './extended-content.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=richText;
const localPhoto=/^\/(?:media\/[a-f0-9-]{36}\.jpg|assets\/(?:experiment|discovery|community)\.jpg)$/;
export function normalizeMap(value){
 if(!value?.trim())return '';
 let source=value.trim();
 if(source.startsWith('<')){const match=source.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);if(!match)throw Error('Paste the Google Maps embed HTML or its embed URL.');source=match[2].replaceAll('&amp;','&');}
 try{const u=new URL(source);if(u.protocol!=='https:'||!['www.google.com','maps.google.com'].includes(u.hostname)||u.username||u.password||!(u.pathname==='/maps/embed'||u.pathname==='/maps'&&u.searchParams.get('output')==='embed'))throw Error();return u.href;}catch{throw Error('Use Google Maps → Share → Embed a map → Copy HTML. Other HTML embeds are not supported.');}
}
function str(value,label,max,required=false){if(typeof value!=='string'||value.length>max||required&&!value.trim())throw Error(`${label}: ${required?'enter text with':'use'} at most ${max} characters.`);return value.trim();}
function items(value,label,max){if(!Array.isArray(value)||value.length>max)throw Error(`${label} allows up to ${max} items.`);const ids=new Set();for(const item of value){if(!item||!/^[-a-z0-9]{1,80}$/.test(item.id)||ids.has(item.id))throw Error(`Reload the editor: ${label} contains an invalid or duplicate item.`);ids.add(item.id);}return value;}
export function validatePhoto(photo,label){
 if(!photo||!localPhoto.test(photo.src))throw Error('Choose a valid uploaded photo for '+label+'.');
 if(!Number.isFinite(photo.x)||!Number.isFinite(photo.y)||photo.x<0||photo.x>100||photo.y<0||photo.y>100)throw Error('Photo framing must be between 0 and 100.');
 return {src:photo.src,alt:str(photo.alt,`${label} description`,500,true),caption:str(photo.caption??'',`${label} caption`,1000),x:photo.x,y:photo.y};
}
function date(value,label,required){const result=str(value??'',label,10,required);if(result&&(!/^\d{4}-\d{2}-\d{2}$/.test(result)||!Number.isFinite(Date.parse(result))||new Date(result).toISOString().slice(0,10)!==result))throw Error(`Choose a valid ${label}.`);return result;}
export function validateCollections(input,validLink){
 const faqs=items(input.faqs,'FAQs',30).map(f=>({id:f.id,question:str(f.question,'FAQ question',250,true),answer:str(f.answer,'FAQ answer',8000,true)}));
 const gallery=items(input.gallery,'Gallery',40).map(p=>({id:p.id,...validatePhoto(p,'Gallery photo')}));
 const events=items(input.events,'Events',60).map(e=>{
  const visible=e.visible===true,startDate=date(e.startDate,'start date',visible),endDate=date(e.endDate,'end date',false);
  if(endDate&&(!startDate||endDate<startDate))throw Error('The event end date must be on or after its start date.');
  const registrationUrl=str(e.registrationUrl??'','Registration link',2000);if(registrationUrl&&!validLink(registrationUrl))throw Error('Use a full https:// registration link or an internal /page path.');
  if(!['auto','upcoming','past'].includes(e.status))throw Error('Choose an event status.');
  if(!['builtin','external','closed'].includes(e.signupMode??'external'))throw Error('Choose a signup mode.');
  const limit=responseLimit(e.responseLimit);if(limit&&((e.signupMode??'external')!=='external'||!googleFormUrl(registrationUrl)))throw Error('Automatic limits need External registration and a full Google Form /viewform URL.');
  return {responseLimit:limit,signupMode:e.signupMode??'external',id:e.id,title:str(e.title,'Event title',160,true),description:str(e.description,'Event description',12000,visible),startDate,endDate,time:str(e.time??'','Event time',160),location:str(e.location??'','Venue name',250,visible),address:str(e.address??'','Address',500),mapEmbed:normalizeMap(str(e.mapEmbed??'','Google Maps embed',12000)),registrationUrl,registrationLabel:str(e.registrationLabel??'Register','Registration button label',80,true),price:str(e.price??'','Price',160),ages:str(e.ages??'','Ages',160),status:e.status,visible};
 });return {kits:validateKits(input.kits??[],validatePhoto),faqs,gallery,events,...validateExtended(input,validatePhoto)};
}
export function allPhotos(content){return [...Object.values(content.photos),...(content.kits||[]).filter(k=>k.visible&&k.photo).map(k=>k.photo),...(content.links.headerLogo?[{src:content.links.headerLogo}]:[]),...(content.foundersPhoto?[content.foundersPhoto]:[]),...content.gallery,...content.team.filter(m=>m.visible&&m.photo).map(m=>m.photo)];}
export function eventStatus(event,now=new Date()){
 if(event.status!=='auto')return event.status;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 return (event.endDate||event.startDate)<today?'past':'upcoming';
}
export function dateLabel(event){const format=d=>new Intl.DateTimeFormat(event.locale||'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Taipei'}).format(new Date(d+'T12:00:00+08:00'));return event.startDate?format(event.startDate)+(event.endDate&&event.endDate!==event.startDate?' – '+format(event.endDate):''):'Date to be announced';}
export function renderFaqs(content){return content.faqs.map(f=>`<details><summary>${esc(f.question)}<span aria-hidden="true">+</span></summary><div class="faq-answer">${lines(f.answer)}</div></details>`).join('')||'<p class="empty-note">Have a question? Get in touch with our team.</p>';}
export function renderGallery(content,preview){return content.gallery.map(p=>`<figure class="gallery-item"><button class="gallery-open" type="button" data-full-photo="${esc(p.src)}" data-alt="${esc(p.alt)}" data-caption="${esc(p.caption)}" aria-label="View photo: ${esc(p.alt)}"><img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy" width="700" height="560" style="object-position:${p.x}% ${p.y}%"></button><figcaption><p>${richText(p.caption)}</p><button type="button" class="like-button" data-photo-id="${p.id}" aria-pressed="false" aria-label="Like photo: ${esc(p.alt)}" ${preview?'disabled':''}><span aria-hidden="true">♡</span> <span class="like-label">Like</span></button></figcaption></figure>`).join('')||'<p class="empty-note">More moments of discovery coming soon.</p>';}
export function renderEvents(content,filter='all',preview=false){
 const events=content.events.filter(e=>e.visible&&(filter==='all'||eventStatus(e)===filter));
 return events.map(e=>`<article class="event-card"><div class="event-card-date"><span class="event-status">${eventStatus(e)==='past'?'Past event':'Upcoming'}</span><p>${esc(dateLabel(e))}</p>${e.time?`<p>${esc(e.time)}</p>`:''}</div><div><h2><a href="/events/${e.id}${preview?'?preview=draft':''}">${esc(e.title)}</a></h2><p class="event-card-description">${esc(plainText(e.description).slice(0,230))}${e.description.length>230?'…':''}</p><p class="event-venue">${esc(e.location)}</p><div class="event-card-actions"><a class="text-link" href="/events/${e.id}${preview?'?preview=draft':''}">View details &amp; location <span aria-hidden="true">↗</span></a></div></div><div class="event-registration">${registrationButton(e,preview)}</div></article>`).join('')||`<div class="events-empty"><h2>${filter==='past'?'Past adventures will appear here.':'More discoveries are on the way.'}</h2><p>${filter==='past'?'Visit again for stories from our workshops.':'There are no '+(filter==='all'?'published':'upcoming')+' events to show right now. Follow us on Instagram or contact the team for the next workshop.'}</p><a class="text-link" href="${esc(content.links.instagram)}" target="_blank" rel="noopener">Follow our discovery on Instagram ↗</a></div>`;
}
export function registrationButton(event,preview=false){
 if(event.formClosed||eventStatus(event)==='past'||event.signupMode==='closed')return '<span class="registration-closed">Registration closed</span>';
 const href=event.signupMode==='builtin'?'/events/'+event.id+(preview?'?preview=draft':''):event.registrationUrl;
 return href?`<a class="button dark event-register" href="${esc(href)}" ${href.startsWith('https:')?'target="_blank" rel="noopener"':''}>${esc(event.registrationLabel||'Register')} <span aria-hidden="true">↗</span></a>`:'<span class="registration-closed">Registration coming soon</span>';
}
export function renderNextWorkshop(content,preview=false){
 const event=content.events.find(e=>e.id===content.nextWorkshop?.eventId&&e.visible&&eventStatus(e)==='upcoming'&&e.signupMode!=='closed');
 if(!event)return '';
 return `<aside class="next-workshop"><p class="section-label">${esc(content.text.nextWorkshopLabel)}</p><h3><a href="/events/${event.id}${preview?'?preview=draft':''}">${esc(event.title)}</a></h3><p>${esc(dateLabel(event))}${event.time?' · '+esc(event.time):''}</p><p>${esc(event.location)}</p>${content.text.nextWorkshopNote?`<div>${richText(content.text.nextWorkshopNote)}</div>`:''}<div class="next-workshop-action">${registrationButton(event,preview)}</div></aside>`;
}
export function renderEventDetail(event,preview){
 const past=eventStatus(event)==='past';const destination=event.address||event.location;
 const directions='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(destination);
 return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/events${preview?'?preview=draft':''}">Events</a><span>/</span><span>${esc(event.title)}</span></nav><p class="eyebrow">${past?'PAST EVENT':'UPCOMING WORKSHOP'}</p><h1>${esc(event.title)}</h1><p class="lede">${esc(dateLabel(event))}${event.time?' · '+esc(event.time):''}</p><div class="event-detail-grid"><div><div class="event-description">${lines(event.description)}</div>${event.mapEmbed?`<section class="map-panel"><h2>Find the workshop</h2><div class="map-placeholder"><p>Load the map to view this location on Google Maps.</p><button type="button" class="button dark" data-map-src="${esc(event.mapEmbed)}" data-map-title="Map of ${esc(event.location)}">Show Google Map</button><p class="map-note">Loading connects to Google. Its privacy settings apply.</p></div></section>`:''}</div><aside class="event-aside"><h2>Workshop details</h2><dl><dt>Location</dt><dd>${esc(event.location)}</dd>${event.address?`<dt>Address</dt><dd>${esc(event.address)}</dd>`:''}${event.ages?`<dt>Ages</dt><dd>${esc(event.ages)}</dd>`:''}${event.price?`<dt>Fee</dt><dd>${esc(event.price)}</dd>`:''}</dl><a class="text-link map-link" href="${esc(directions)}" target="_blank" rel="noopener">Get directions ↗</a><div class="event-booking">${past||event.signupMode==='closed'?'<p>Registration is closed for this event.</p><a class="button dark" href="/events?filter=upcoming">Find upcoming workshops ↗</a>':event.signupMode==='builtin'?signupForm(event,preview):event.registrationUrl?`<a class="button dark" href="${esc(event.registrationUrl)}" ${event.registrationUrl.startsWith('https:')?'target="_blank" rel="noopener"':''}>${esc(event.registrationLabel)} ↗</a><p>Review availability and complete registration on the linked page.</p>`:'<p>Registration details are coming soon.</p>'}</div></aside></div>`;
}

function signupForm(event,preview){return `<form class="signup-form" data-event-id="${event.id}"><h3>Workshop signup</h3><label>Participant name<input name="name" autocomplete="off" maxlength="120" required></label><label>Parent / guardian email<input name="email" type="email" autocomplete="email" maxlength="254" required></label><div class="form-trap" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><label class="signup-check"><input name="privacyAccepted" type="checkbox" required><span>I have read the <a href="/privacy.html" target="_blank" rel="noopener">privacy notice</a> and agree to be contacted about this signup.</span></label><label class="signup-check"><input name="emailOptIn" type="checkbox"><span>Also email me about future Little Scientists workshops. (Optional)</span></label><button class="button dark" type="submit" ${preview?'disabled':''}>Submit signup request</button><p class="signup-status" role="status" aria-live="polite">${preview?'Signups are disabled in draft previews.':'Our team will email you to confirm availability. A request does not guarantee a place.'}</p></form>`;}
