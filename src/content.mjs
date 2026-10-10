import defaults from './default-content.json' with {type:'json'};
import fields from './content-schema.json' with {type:'json'};
import {validatePhoto,validateCollections} from './collections.mjs';
export {defaults,fields};
export const PHOTO_SLOTS=['hero','discovery','community'];
export function validLink(value){
 if(typeof value!=='string'||value.length>2000||/[\u0000-\u0020\\]/.test(value))return false;
 if(/^#[a-z][\w-]*$/i.test(value))return true;
 if(value.startsWith('/')&&!value.startsWith('//')){
  try{return new URL(value,'https://local.invalid').origin==='https://local.invalid'&&!/%5c/i.test(value);}catch{return false;}
 }
 try{const u=new URL(value);return u.protocol==='https:'&&!!u.hostname&&!u.username&&!u.password;}catch{return false;}
}
export function validateContent(input){
 if(!input||typeof input!=='object'||!input.text||!input.links||!input.photos||!input.contact)throw Error('The website content is incomplete. Reload the editor and try again.');
 const clean={text:{},links:{},photos:{},contact:{},translations:{},interfaceText:{},nextWorkshop:{eventId:''}};
 if(input.translations!==undefined){if(!input.translations||typeof input.translations!=='object'||Array.isArray(input.translations)||Object.keys(input.translations).length>1500)throw Error('Too many translations.');for(const [key,value]of Object.entries(input.translations)){if(key.length>16000||typeof value!=='string'||value.length>20000)throw Error('Translation is too long.');if(value.trim())clean.translations[key]=value.trim();}}
 for(const field of fields){
  const store=field.kind==='link'?'links':'text';const value=input[store][field.key];
  if(typeof value!=='string'||value.length>field.max)throw Error(`${field.label} must be text with at most ${field.max} characters.`);
  if((field.required||field.kind==='heading'||field.kind==='link')&&!value.trim())throw Error(`${field.label} cannot be empty.`);
  if(field.kind==='link'&&!validLink(value))throw Error(`${field.label}: use a complete https:// URL, a /page path, or a #section link.`);
  clean[store][field.key]=value.replace(/\r\n?/g,'\n').trim();
 }
 const email=input.contact.email;
 if(typeof email!=='string'||email.length>254||!/^([^\s@<>]+)@([^\s@<>]+)\.([^\s@<>]+)$/.test(email))throw Error('Enter a valid contact email address.');
 clean.contact.email=email.trim();
 for(const slot of PHOTO_SLOTS){
  clean.photos[slot]=validatePhoto(input.photos[slot],slot);
 }
 for(const [key,value]of Object.entries(input.interfaceText??{})){if(key.length>16000||typeof value!=='string'||value.length>20000)throw Error('Interface text is too long.');if(value.trim())Object.defineProperty(clean.interfaceText,key,{value:value.trim(),enumerable:true,writable:true});}
 if(Object.keys(clean.interfaceText).length>1500)throw Error('Too many interface labels.');
 const next=input.nextWorkshop?.eventId??'';if(typeof next!=='string'||next&&!input.events.some(e=>e.id===next))throw Error('Choose an existing next workshop.');clean.nextWorkshop={eventId:next};
 Object.assign(clean,validateCollections(input,validLink));
 if(JSON.stringify(clean).length>900000)throw Error('The website text is too large to save.');
 return clean;
}
export function mergeContent(saved){
 if(!saved)return structuredClone(defaults);
 const photos=Object.fromEntries(PHOTO_SLOTS.map(slot=>[slot,{...defaults.photos[slot],...saved.photos?.[slot]}]));
 return {testimonials:saved.testimonials??[],foundersPhoto:saved.foundersPhoto??null,foundersPhotoHeight:saved.foundersPhotoHeight??460,interfaceText:saved.interfaceText??{},nextWorkshop:saved.nextWorkshop??{eventId:''},translations:saved.translations??{},text:{...defaults.text,...saved.text},links:{...defaults.links,...saved.links,workshops:['/workshops','/workshops/','/workshops.html'].includes(saved.links?.workshops)?'/events':saved.links?.workshops??defaults.links.workshops},photos,contact:{...defaults.contact,...saved.contact},faqs:saved.faqs??Array.from({length:5},(_,i)=>({id:'faq-'+(i+1),question:saved.text?.['faqQuestion'+(i+1)]??defaults.faqs[i]?.question,answer:saved.text?.['faqAnswer'+(i+1)]??defaults.faqs[i]?.answer})).filter(f=>f.question&&f.answer),events:(saved.events??structuredClone(defaults.events)).map(e=>({signupMode:'external',...e})),gallery:saved.gallery??structuredClone(defaults.gallery),metrics:saved.metrics??structuredClone(defaults.metrics),team:saved.team??structuredClone(defaults.team),timeline:saved.timeline??structuredClone(defaults.timeline)};
}
export function gmailLink(email,subject='Hello Little Scientists Taipei'){
 return 'https://mail.google.com/mail/?'+new URLSearchParams({view:'cm',fs:'1',tf:'1',to:email,su:subject}).toString();
}
export function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function jpegDimensions(bytes){
 if(bytes.length<20||bytes[0]!==255||bytes[1]!==216||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)return null;
 let p=2;
 while(p+3<bytes.length){
  if(bytes[p++]!==255)return null;while(bytes[p]===255)p++;const marker=bytes[p++];
  if(marker===217||marker===218)break;if(marker===1||(marker>=208&&marker<=215))continue;
  const length=(bytes[p]<<8)|bytes[p+1];if(length<2||p+length>bytes.length)return null;
  if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
   if(length<8)return null;const height=(bytes[p+3]<<8)|bytes[p+4],width=(bytes[p+5]<<8)|bytes[p+6];return width&&height?{width,height}:null;
  }p+=length;
 }return null;
}
