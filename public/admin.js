const uploadPreviews=new Map();
new MutationObserver(()=>{for(const img of document.querySelectorAll('img[src]')){const src=img.getAttribute('src');if(uploadPreviews.has(src))img.src=uploadPreviews.get(src);}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
import {richText,plainText} from '/formatting.js';
let state=null,revision=0,fields=[],defaults=null,dirty=false,busy=false,uploadCount=0,activeGroup=new URLSearchParams(location.search).get('section')==='chinese'?'中文內容':new URLSearchParams(location.search).get('section')==='impact'?'Impact':new URLSearchParams(location.search).get('section')==='header'?'Header':'Homepage',editGeneration=0;
const $=selector=>document.querySelector(selector);
const help={Header:'Edit the shared header brand, logo image URL, button and dropdown links. Add up to six groups with ten links each. Reorder with Move up/down. Translate labels in 中文內容. The workshop button destination is in Links & Contact.',Homepage:'Edit the opening headline and introduction. Use the formatting buttons to style headings and body text.','The Experience':'Explain what children do and what makes the experience special.','Our Programs':'Keep family workshops and school partnerships clear and up to date.','Our Story':'Tell your story in your own words.',FAQs:'Fill in, add, reorder, or remove questions and answers. The public FAQ expands naturally to fit each answer. Up to 30 questions.','Join & Footer':'Edit the invitation to join and the closing text.','Community Event':'Update the featured community story and its link. The original July camp page stays available.','Workshop Page':'Edit the page at /workshops. Its registration button opens your event listings.','Links & Contact':'Paste full https:// links for outside resources. The event listings page is /events. Set individual registration links in Events. Gmail uses the visitor’s signed-in Google account; this email is the recipient.',Photos:'Replace the main website photos, edit their alt text and visible captions, and adjust their focus. Visitors see changes only after you publish.',Events:'Add workshops, descriptions, dates, locations, and registration links. Automatic status moves an event to Past after its end date in Taipei. Your chosen item order is preserved within each filter. Hidden events stay out of public listings. Up to 60 events.',Gallery:'Upload, caption, reorder, and remove gallery photos. Each published photo has a like button; replacing a photo keeps its existing likes. Up to 40 photos.'};
function notice(message,error=false){const el=$('#notice');el.replaceChildren();el.textContent=message;el.classList.toggle('error',error);el.hidden=false;}
function updateActions(){updateReminder();for(const id of ['#save-draft','#publish'])$(id).disabled=!state||busy||uploadCount>0;$('#save-state').textContent=busy?'Saving…':uploadCount?'Uploading photo…':dirty?'Unsaved changes':'Draft saved';}
function changed(){editGeneration++;dirty=true;$('#notice').hidden=true;updateActions();}
async function api(path,options={}){
 const res=await fetch(path,{credentials:'same-origin',...options});let data;
 try{data=await res.json();}catch{
  const error=new Error(res.redirected?'Your sign-in expired. Sign in again, then return here to save.':'The server did not respond as expected. Your changes are still here. Try again.');
  if(res.redirected)error.status=401;throw error;
 }
 if(!res.ok){const e=new Error(data.error||'The change could not be saved.');e.status=res.status;throw e;}
 if(path==='/api/editor/upload'&&data.src&&options.body instanceof Blob){
  const previous=uploadPreviews.get(data.src);if(previous)URL.revokeObjectURL(previous);
  uploadPreviews.set(data.src,URL.createObjectURL(options.body));
 }
 return data;
}
function fieldControl({label,value,onInput,multiline=false,rows=3,type='text',max=4000,hint,format=multiline}){
 const wrap=document.createElement('div');wrap.className='field';const title=document.createElement('label');title.className='field-label';title.textContent=label;wrap.append(title);
 const input=document.createElement(multiline?'textarea':'input');if(!multiline)input.type=type;else input.rows=rows;input.id='field-'+crypto.randomUUID();title.htmlFor=input.id;input.value=value;input.maxLength=max;input.addEventListener('input',()=>onInput(input.value));wrap.append(input);if(format)addFormatting(wrap,input,onInput);
 if(hint){const small=document.createElement('small');small.textContent=hint;wrap.append(small);}return wrap;
}
function renderTabs(){const nav=$('#editor-tabs');nav.replaceChildren();const groups=[...new Set(fields.map(f=>f.group))].filter(g=>g!=='Links & Contact'&&g!=='Archived workshop copy');groups.push('Photos','中文內容','Interface text','Links & Contact','Signups');for(const group of groups){const button=document.createElement('button');button.type='button';button.textContent=group;button.classList.toggle('active',group===activeGroup);button.setAttribute('aria-current',group===activeGroup?'page':'false');button.addEventListener('click',()=>{activeGroup=group;renderTabs();renderFields();});nav.append(button);}filterEditorSections();}
function renderFields(){const area=$('#fields');area.replaceChildren();$('#section-title').textContent=activeGroup;$('#section-help').textContent=help[activeGroup]||'Edit your website content.';updateReminder();
 if(activeGroup==='Google Form'||activeGroup==='Signups'){
 const box=document.createElement('p');box.className='section-help';box.append(document.createTextNode('Google Form responses are saved in Google Sheets, separately from built-in website requests. '));
 for(const [label,url] of [['Edit Google Form','https://docs.google.com/forms/d/1Huvaq9SNDreGpZ43ZyKv7NDP9ZeVzbaQbsub285t-Ag/edit'],['Open response Sheet','https://docs.google.com/spreadsheets/d/1-ioVQ-qDiEu1qUysewPXWwHvnsW40GaJMfSRsIMhKDg/edit']]){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent=label;box.append(a,document.createTextNode(' · '));}area.append(box);
 }
 if(activeGroup==='中文內容'){renderLanguages(area);return;}
 if(activeGroup==='Interface text'){renderInterfaceEditor(area);return;}
 if(activeGroup==='Photos'){renderPhotos(area);return;}
 if(activeGroup==='Signups'){renderSignups(area);return;}
 if(activeGroup==='Links & Contact')area.append(fieldControl({label:'Contact email address',value:state.contact.email,type:'email',max:254,hint:'Contact buttons open a Gmail compose window addressed to this email.',onInput:value=>{state.contact.email=value;changed();}}));
 for(const field of fields.filter(f=>f.group===activeGroup)){
  const store=field.kind==='link'?'links':'text';area.append(fieldControl({label:field.label,value:state[store][field.key],multiline:field.kind==='long'||field.kind==='heading',rows:field.kind==='long'?4:2,max:field.max,hint:null,onInput:value=>{state[store][field.key]=value;changed();}}));
 }
 if(activeGroup==='Header')renderHeaderEditor(area);
 if(activeGroup==='FAQs')renderFaqEditor(area);
 if(activeGroup==='Events')renderEventEditor(area);
 if(activeGroup==='Gallery')renderGalleryEditor(area);
 if(activeGroup==='Impact')renderNumbers(area);
 if(activeGroup==='Next workshop')renderNextWorkshop(area);
 if(activeGroup==='Team')renderTeamEditor(area);
 if(activeGroup==='Testimonials')renderTestimonialEditor(area);
 if(activeGroup==='Timeline')renderTimelineEditor(area);
}
async function preparePhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG, or WebP image.');
 if(file.size>20*1024*1024)throw Error('Choose a photo smaller than 20 MB.');
 const objectUrl=URL.createObjectURL(file);
 try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('This image could not be opened. Please choose a different file.'));img.src=objectUrl;});
  if(!img.naturalWidth||img.naturalWidth*img.naturalHeight>48000000)throw Error('Choose a photo smaller than 48 megapixels.');
  const scale=Math.min(1,2000/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fffef7';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('The photo could not be prepared.')),'image/jpeg',.88));
 }finally{URL.revokeObjectURL(objectUrl);}
}
function renderPhotos(area){
 const descriptions={hero:['Opening photo','A wide landscape photo works best. Keep the important faces near the middle.'],discovery:['Discovery photo','A portrait or vertical photo works well here and on the workshop page.'],community:['Team & community photo','Use a landscape photo of your team or a workshop.']};
 for(const [slot,[title,description]]of Object.entries(descriptions)){
  const card=document.createElement('section');card.className='photo-editor '+slot;const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=description;card.append(h,p);
  const img=document.createElement('img');img.className='photo-preview';img.src=state.photos[slot].src;img.alt=state.photos[slot].alt;img.style.objectPosition=`${state.photos[slot].x}% ${state.photos[slot].y}%`;card.append(img);
  const controls=document.createElement('div');controls.className='photo-controls';const label=document.createElement('label');label.className='photo-upload';label.textContent='Upload replacement';const upload=document.createElement('input');upload.type='file';upload.accept='image/jpeg,image/png,image/webp';upload.setAttribute('aria-label','Replace '+title.toLowerCase());label.append(upload);controls.append(label);
  const restore=document.createElement('button');restore.type='button';restore.textContent='Use original photo';restore.addEventListener('click',()=>{state.photos[slot]={...defaults.photos[slot]};changed();renderFields();});controls.append(restore);card.append(controls);
  const status=document.createElement('p');status.className='upload-state';status.setAttribute('role','status');card.append(status);
  upload.addEventListener('change',async()=>{const file=upload.files?.[0];if(!file)return;uploadCount++;upload.disabled=true;restore.disabled=true;updateActions();status.textContent='Preparing your photo…';try{const blob=await preparePhoto(file);status.textContent='Uploading…';const result=await api('/api/editor/upload',{method:'POST',headers:{'Content-Type':'image/jpeg','X-LST-Editor':'1'},body:blob});state.photos[slot].src=result.src;img.src=result.src;changed();status.textContent='Uploaded. Save a draft or publish to use this photo. New photos may take about a minute to appear everywhere.';}catch(e){status.textContent=e.message;notice(e.message,true);}finally{uploadCount--;upload.disabled=false;restore.disabled=false;upload.value='';updateActions();}});
  card.append(fieldControl({label:'Photo description (for accessibility)',value:state.photos[slot].alt,max:500,onInput:value=>{state.photos[slot].alt=value;img.alt=value;changed();}}));
  card.append(fieldControl({label:'Visible photo caption',value:state.photos[slot].caption||'',max:1000,multiline:true,onInput:value=>{state.photos[slot].caption=value;changed();}}));
  const sliders=document.createElement('div');sliders.className='photo-sliders';for(const [axis,name]of [['x','Horizontal focus'],['y','Vertical focus']]){const label=document.createElement('label');label.className='field';const title=document.createElement('span');title.textContent=name;const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='100';slider.value=state.photos[slot][axis];slider.addEventListener('input',()=>{state.photos[slot][axis]=Number(slider.value);img.style.objectPosition=`${state.photos[slot].x}% ${state.photos[slot].y}%`;changed();});label.append(title,slider);sliders.append(label);}card.append(sliders);area.append(card);
 }
}
async function save(publish){if(busy||uploadCount)return;const savedGeneration=editGeneration;busy=true;updateActions();try{const result=await api('/api/editor/'+(publish?'publish':'save'),{method:'POST',headers:{'Content-Type':'application/json','X-LST-Editor':'1'},body:JSON.stringify({content:state,revision})});revision=result.revision;dirty=editGeneration!==savedGeneration;notice(dirty?'That version was saved. You have newer unsaved changes.':publish?'Your changes are live. Open “View website” to see them.':'Draft saved online. Open “Preview saved draft” to review it.');if(publish)$('#published-date').textContent='Published '+new Date(result.updatedAt).toLocaleString();}catch(e){notice(e.message,true);if(e.status===401){const a=document.createElement('a');a.href='/admin';a.target='_blank';a.textContent=' Sign in again in a new tab, then return here to save.';$('#notice').append(a);}}finally{busy=false;updateActions();}}
$('#save-draft').addEventListener('click',()=>save(false));$('#publish').addEventListener('click',()=>save(true));$('#content-form').addEventListener('submit',e=>e.preventDefault());$('#preview-draft').addEventListener('click',e=>{if(dirty||busy||uploadCount){e.preventDefault();notice('Save your draft first, then preview the saved version.');}});window.addEventListener('beforeunload',e=>{if(dirty||uploadCount){e.preventDefault();e.returnValue='';}});
async function start(){try{const result=await api('/api/editor');state=result.content;revision=result.revision;fields=result.fields;defaults=result.defaults;$('#loading-state').hidden=true;$('#content-form').hidden=false;$('#published-date').textContent=result.publishedAt?'Published '+new Date(result.publishedAt).toLocaleString():'Your current website stays live until you publish.';renderTabs();renderFields();updateActions();}catch(e){$('#loading-state').replaceChildren();const h=document.createElement('h1');h.textContent='We couldn’t load the editor.';const p=document.createElement('p');p.textContent=e.message;const link=document.createElement('a');link.href='/admin';link.textContent='Sign in with the site owner’s account';$('#loading-state').append(h,p,link);notice(e.message,true);}}
start();

function action(label,callback){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',callback);return b;}
function collectionControls(collection,index,card){
 const bar=document.createElement('div');bar.className='collection-actions';
 const up=action('Move up',()=>{[collection[index-1],collection[index]]=[collection[index],collection[index-1]];changed();renderFields();});up.disabled=index===0;
 const down=action('Move down',()=>{[collection[index+1],collection[index]]=[collection[index],collection[index+1]];changed();renderFields();});down.disabled=index===collection.length-1;
 const remove=action('Remove',()=>{const [item]=collection.splice(index,1);changed();renderFields();notice('Removed from your draft.');$('#notice').append(action('Undo removal',()=>{collection.splice(Math.min(index,collection.length),0,item);changed();renderFields();}));});bar.append(up,down,remove);card.append(bar);
}
function collectionCard(title){const card=document.createElement('section');card.className='collection-card';const h=document.createElement('h2');h.textContent=title;card.append(h);return card;}
function renderFaqEditor(area){
 for(const [index,faq] of state.faqs.entries()){
  const card=collectionCard('Question '+(index+1));
  card.append(fieldControl({label:'Question',value:faq.question,max:250,onInput:value=>{faq.question=value;changed();}}),fieldControl({label:'Answer',value:faq.answer,max:8000,multiline:true,rows:5,onInput:value=>{faq.answer=value;changed();}}));collectionControls(state.faqs,index,card);area.append(card);
 }
 const add=action('Add a question',()=>{state.faqs.push({id:crypto.randomUUID(),question:'',answer:''});changed();renderFields();area.lastElementChild.previousElementSibling?.querySelector('input')?.focus();});add.disabled=state.faqs.length>=30;area.append(add);
}
function selectField(label,value,options,change){const wrap=document.createElement('label');wrap.className='field';const title=document.createElement('span');title.textContent=label;const select=document.createElement('select');for(const [key,text] of options){const option=document.createElement('option');option.value=key;option.textContent=text;select.append(option);}select.value=value;select.addEventListener('change',()=>change(select.value));wrap.append(title,select);return wrap;}
function renderEventEditor(area){
 for(const [index,event] of state.events.entries()){
  const card=collectionCard(event.title||'New event');const field=(key,label,options={})=>fieldControl({label,value:event[key]||'',onInput:value=>{event[key]=value;changed();},...options});
  const visible=document.createElement('label');visible.className='checkbox-field';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=event.visible;checkbox.addEventListener('change',()=>{event.visible=checkbox.checked;changed();});visible.append(checkbox,document.createTextNode(' Show this event on the website after publishing'));card.append(visible);
  card.append(field('title','Event title',{max:160}),field('description','Description',{multiline:true,rows:6,max:12000}));
  const dates=document.createElement('div');dates.className='editor-two-columns';dates.append(field('startDate','Start date',{type:'date',max:10}),field('endDate','End date (optional)',{type:'date',max:10}));card.append(dates,field('time','Time or schedule',{max:160,hint:'For example: 10:00–12:00, Taipei time.'}));
  card.append(selectField('Event status',event.status,[['auto','Automatic — based on the event date'],['upcoming','Upcoming'],['past','Past']],value=>{event.status=value;changed();}));
  card.append(field('location','Venue name',{max:250}),field('address','Full address',{max:500}),field('mapEmbed','Google Maps embed HTML or URL',{multiline:true,rows:3,max:12000,hint:'Google Maps → Share → Embed a map → Copy HTML. Paste it here. Only the Google Maps frame is used; no other HTML runs. Leave blank for a directions link without an embedded map.'}));
  const details=document.createElement('div');details.className='editor-two-columns';details.append(field('ages','Age group',{max:160}),field('price','Fee',{max:160}));card.append(details);
  card.append(selectField('Signup method',event.signupMode||'external',[['builtin','Built-in signup form'],['external','External registration link'],['closed','Registration closed']],value=>{event.signupMode=value;changed();}));
  card.append(field('registrationUrl','Registration form link',{max:2000,hint:'Paste this event’s published Google Form link (forms.gle or docs.google.com/forms). Each event can use a different form. Leave blank until registration is ready.'}),field('registrationLabel','Registration button label',{max:80}));
  const preview=document.createElement('a');preview.href='/events/'+event.id+'?preview=draft';preview.target='_blank';preview.rel='noopener';preview.textContent='Preview this event after saving ↗';preview.addEventListener('click',e=>{if(dirty||busy||uploadCount){e.preventDefault();notice('Save your draft before opening the event preview.');}});card.append(preview);collectionControls(state.events,index,card);area.append(card);
 }
 const add=action('Add an event',()=>{state.events.unshift({id:crypto.randomUUID(),title:'New workshop',description:'',startDate:'',endDate:'',time:'',location:'',address:'',mapEmbed:'',registrationUrl:'/signup',registrationLabel:'Enquire / 活動洽詢',price:'',ages:'',status:'auto',signupMode:'external',visible:false});changed();renderFields();area.querySelector('.collection-card input:not([type=checkbox])')?.focus();});add.disabled=state.events.length>=60;area.append(add);
}
function photoUpload(labelText,onUploaded){
 const label=document.createElement('label');label.className='photo-upload';label.append(document.createTextNode(labelText));const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.setAttribute('aria-label',labelText);label.append(input);
 input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;uploadCount++;input.disabled=true;updateActions();notice('Preparing and uploading your photo…');try{const blob=await preparePhoto(file);const result=await api('/api/editor/upload',{method:'POST',headers:{'Content-Type':'image/jpeg','X-LST-Editor':'1'},body:blob});onUploaded(result.src);changed();renderFields();notice('Photo uploaded. Add its description and caption, then save a draft or publish.');}catch(e){notice(e.message,true);}finally{input.value='';input.disabled=false;uploadCount--;updateActions();}});return label;
}
function renderGalleryEditor(area){
 for(const [index,photo] of state.gallery.entries()){
  const card=collectionCard('Gallery photo '+(index+1));const img=document.createElement('img');img.className='photo-preview';img.src=photo.src;img.alt=photo.alt;img.style.objectPosition=`${photo.x}% ${photo.y}%`;card.append(img);
  card.append(photoUpload('Replace gallery photo '+(index+1),src=>{photo.src=src;}));
  card.append(fieldControl({label:'Alt text (describe the image)',value:photo.alt,max:500,onInput:value=>{photo.alt=value;img.alt=value;changed();}}),fieldControl({label:'Visible caption',value:photo.caption,max:1000,multiline:true,onInput:value=>{photo.caption=value;changed();}}));
  for(const [axis,title] of [['x','Horizontal focus'],['y','Vertical focus']]){const wrap=document.createElement('label');wrap.className='field';const span=document.createElement('span');span.textContent=title;const slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=100;slider.value=photo[axis];slider.addEventListener('input',()=>{photo[axis]=Number(slider.value);img.style.objectPosition=`${photo.x}% ${photo.y}%`;changed();});wrap.append(span,slider);card.append(wrap);}
  collectionControls(state.gallery,index,card);area.append(card);
 }
 if(state.gallery.length<40)area.append(photoUpload('Add a gallery photo',src=>{state.gallery.push({id:crypto.randomUUID(),src,alt:'Workshop photograph — add a description',caption:'',x:50,y:50});}));
}
function addFormatting(wrap,input,onInput){
 const toolbar=document.createElement('div');toolbar.className='format-toolbar';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Text formatting');const preview=document.createElement('div');preview.className='format-preview';preview.innerHTML=richText(input.value);const label=document.createElement('span');label.className='format-preview-label';label.textContent='Formatting preview';
 function edit(kind){const start=input.selectionStart??0,end=input.selectionEnd??input.value.length,selected=input.value.slice(start,end)||'text';let value=selected;if(kind==='bold')value='**'+selected+'**';if(kind==='italic')value='*'+selected+'*';if(kind==='underline')value='__'+selected+'__';if(kind==='bullet')value=selected.split('\n').map(s=>'- '+s).join('\n');if(kind==='number')value=selected.split('\n').map((s,i)=>(i+1)+'. '+s).join('\n');if(kind==='clear')value=plainText(selected);if(kind==='link'){const href=prompt('Link destination (https://… or /page)');if(!href)return;value='['+selected+']('+href+')';}if(input.value.length-(end-start)+value.length>input.maxLength){notice('This text is too long for this field.',true);return;}input.setRangeText(value,start,end,'select');input.focus();onInput(input.value);preview.innerHTML=richText(input.value);}
 for(const [kind,text] of [['bold','Bold'],['italic','Italic'],['underline','Underline'],['bullet','Bullets'],['number','Numbered list'],['link','Link'],['clear','Clear formatting']]){const button=action(text,()=>edit(kind));button.addEventListener('mousedown',e=>e.preventDefault());toolbar.append(button);}
 input.addEventListener('input',()=>preview.innerHTML=richText(input.value));input.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['b','i','u'].includes(e.key.toLowerCase())){e.preventDefault();edit({b:'bold',i:'italic',u:'underline'}[e.key.toLowerCase()]);}});wrap.insertBefore(toolbar,input);wrap.append(label,preview);
}
help.Impact='Three large-number slots. Enter verified figures, such as 60+, with a label. Blank values show — until you enter your verified figures.';
help.Team='Edit the mission statement and officer introduction, feature co-founders, and group members by committee. Add portraits and adjust their sizes. Save a draft, then publish when ready.';
help.Timeline='Add dated milestones or lessons. Each item has its own detail page, can link to a program and its signup form. Your chosen order is preserved.';
help.Signups='Private workshop requests and email-list opt-ins. These records are only visible to the site owner. The website records requests; it does not automatically send confirmation or marketing emails.';
function renderNumbers(area){state.metrics.forEach((metric,index)=>{const card=collectionCard('Number '+(index+1));card.append(fieldControl({label:'Number or value',value:metric.value,max:30,hint:'Enter a verified figure. A blank value displays an em dash.',onInput:value=>{metric.value=value;changed();}}),fieldControl({label:'Label',value:metric.label,max:100,onInput:value=>{metric.label=value;changed();}}));area.append(card);});}
function checkboxControl(label,value,onChange){const el=document.createElement('label');el.className='checkbox-field';const input=document.createElement('input');input.type='checkbox';input.checked=value;input.addEventListener('change',()=>onChange(input.checked));el.append(input,document.createTextNode(label));return el;}
function rangeControl(label,value,min,max,onChange){const el=document.createElement('label');el.className='field';const name=document.createElement('span');name.textContent=label+' ('+value+')';const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.value=value;input.addEventListener('input',()=>{name.textContent=label+' ('+input.value+')';onChange(Number(input.value));});el.append(name,input);return el;}
function renderTeamEditor(area){
 const shared=collectionCard('Co-founders together — shared photo');shared.append(photoUpload('Upload co-founders together photo',src=>{state.foundersPhoto={src,alt:'Co-founders of Little Scientists Taipei',caption:'',x:50,y:50};}));
 if(state.foundersPhoto){const p=state.foundersPhoto,img=document.createElement('img');img.className='photo-preview';img.src=p.src;img.alt=p.alt;shared.append(img);for(const [key,label,max]of [['alt','Shared photo alt text',500],['caption','Shared photo caption',1000]])shared.append(fieldControl({label,value:p[key],max,multiline:key==='caption',onInput:value=>{p[key]=value;changed();}}));for(const [axis,label]of [['x','Horizontal focus'],['y','Vertical focus']])shared.append(rangeControl(label,p[axis],0,100,value=>{p[axis]=value;img.style.objectPosition=`${p.x}% ${p.y}%`;changed();}));shared.append(rangeControl('Shared photo height',state.foundersPhotoHeight,200,700,value=>{state.foundersPhotoHeight=value;changed();}),action('Remove shared photo',()=>{state.foundersPhoto=null;changed();renderFields();}));}else{const note=document.createElement('p');note.className='need-info';note.textContent='Need extra info — Upload your approved photo of the co-founders together. It will appear above their introductions.';shared.append(note);}area.append(shared);
 for(const [index,member] of state.team.entries()){
  const card=collectionCard(member.name||'Team member');card.append(checkboxControl('Featured co-founder',member.founder??/co-founder/i.test(member.role),value=>{member.founder=value;changed();}),fieldControl({label:'Committee / section name',value:member.committee??(/co-founder/i.test(member.role)?'Co-founders':'Team'),max:120,hint:'Members with the same section name appear together. Co-founders are featured first.',onInput:value=>{member.committee=value;changed();}}));card.append(checkboxControl('Show this team member',member.visible,value=>{member.visible=value;changed();}));
  for(const [key,label,max,multiline] of [['name','Name',120,false],['role','Role',160,false],['bio','Biography',6000,true]])card.append(fieldControl({label,value:member[key],max,multiline,onInput:value=>{member[key]=value;changed();}}));
  const holder=document.createElement('div');holder.className='team-photo-preview';const img=document.createElement('img');function frame(){img.style.width=member.photoWidth+'%';img.style.height=member.photoHeight+'px';if(member.photo)img.style.objectPosition=`${member.photo.x}% ${member.photo.y}%`;}
  if(member.photo){img.src=member.photo.src;img.alt=member.photo.alt;frame();holder.append(img);card.append(holder);}
  card.append(photoUpload('Upload portrait for '+member.name,src=>{member.photo={src,alt:member.name,caption:'',x:50,y:50};}));
  if(member.photo){for(const [key,label,max] of [['alt','Portrait alt text',500],['caption','Portrait caption',1000]])card.append(fieldControl({label,value:member.photo[key],max,multiline:key==='caption',onInput:value=>{member.photo[key]=value;changed();}}));for(const [axis,label] of [['x','Horizontal focus'],['y','Vertical focus']])card.append(rangeControl(label,member.photo[axis],0,100,value=>{member.photo[axis]=value;frame();changed();}));card.append(action('Remove portrait',()=>{member.photo=null;changed();renderFields();}));}
  card.append(rangeControl('Photo width (%)',member.photoWidth,50,100,value=>{member.photoWidth=value;frame();changed();}),rangeControl('Photo height (pixels)',member.photoHeight,160,520,value=>{member.photoHeight=value;frame();changed();}));collectionControls(state.team,index,card);area.append(card);
 }
 const add=action('Add team member',()=>{state.team.push({id:crypto.randomUUID(),name:'New team member',role:'',committee:'Team',founder:false,bio:'',photo:null,photoWidth:100,photoHeight:320,visible:false});changed();renderFields();});add.disabled=state.team.length>=40;area.append(add);
}
function renderTimelineEditor(area){
 for(const [index,item] of state.timeline.entries()){
  const card=collectionCard(item.title);card.append(checkboxControl('Show this timeline item',item.visible,value=>{item.visible=value;changed();}));
  card.append(checkboxControl('In planning — details may change',item.planned===true,value=>{item.planned=value;changed();}),fieldControl({label:'School / location served',value:item.location||'',max:250,hint:'Optional. Otherwise uses the linked event location.',onInput:value=>{item.location=value;changed();}}));
  for(const [key,label,max,multiline,type] of [['title','Title',180,false,'text'],['date','Date',10,false,'date'],['description','Lesson / description',12000,true,'text']])card.append(fieldControl({label,value:item[key],max,multiline,type,onInput:value=>{item[key]=value;changed();}}));
  card.append(selectField('Linked program / signup',item.eventId,[['','No linked program'],...state.events.map(e=>[e.id,e.title])],value=>{item.eventId=value;changed();}));const link=document.createElement('a');link.href='/timeline/'+item.id+'?preview=draft';link.target='_blank';link.rel='noopener';link.textContent='Preview lesson after saving ↗';link.addEventListener('click',e=>{if(dirty){e.preventDefault();notice('Save your draft before previewing.');}});card.append(link);collectionControls(state.timeline,index,card);area.append(card);
 }
 const add=action('Add timeline item',()=>{state.timeline.push({id:crypto.randomUUID(),title:'New lesson',date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'}),description:'Add the lesson description here.',eventId:'',visible:false});changed();renderFields();});add.disabled=state.timeline.length>=80;area.append(add);
}
let signupOffset=0;
async function renderSignups(area){
 const actions=document.createElement('div');actions.className='collection-actions';for(const [href,label] of [['/api/editor/signups.csv','Download all signups (CSV)'],['/api/editor/signups.csv?list=email','Download email opt-ins (CSV)']]){const a=document.createElement('a');a.href=href;a.className='quiet-button';a.textContent=label;actions.append(a);}area.append(actions);const output=document.createElement('div');output.className='signup-records';output.textContent='Loading signups…';area.append(output);
 try{const result=await api('/api/editor/signups?offset='+signupOffset);output.replaceChildren();if(!result.rows.length)output.textContent='No signup requests yet.';for(const row of result.rows){const card=collectionCard(row.participant_name);for(const text of [row.event_title,row.email,'Email list: '+(row.email_opt_in?'Opted in':'Not opted in'),'Submitted: '+new Date(row.created_at).toLocaleString()]){const p=document.createElement('p');p.textContent=text;card.append(p);}output.append(card);}const nav=document.createElement('div');nav.className='collection-actions';if(signupOffset)nav.append(action('Previous 50',()=>{signupOffset=Math.max(0,signupOffset-50);renderFields();}));if(result.hasMore)nav.append(action('Next 50',()=>{signupOffset+=50;renderFields();}));output.append(nav);}catch(e){output.textContent=e.message;}
}

function updateReminder(){
 const el=$('#section-reminder');if(!el||!state)return;let message='';
 if(activeGroup==='Impact'&&state.metrics.some(m=>!m.value||!m.label))message='Enter your verified numbers and labels. Unconfirmed values display an em dash.';
 if(activeGroup==='Team'&&state.team.some(m=>!m.photo||!m.bio))message='Add approved team portraits and any missing biographies. Adjust photo sizes in each profile.';
 if(activeGroup==='Events'&&!state.events.some(e=>e.visible&&e.startDate>=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'})))message='Add the next workshop’s dates, venue, price, and signup details, then turn on its visibility.';
 if(activeGroup==='Timeline'&&state.timeline.some(t=>!t.eventId||!t.description))message='Complete lesson descriptions and link each relevant milestone to a program for signup.';
 if(activeGroup==='Photos'&&Object.values(state.photos).some(p=>p.src.startsWith('/assets/')))message='Replace the original photos when your new photos are ready; review captions and alt text.';
 if(activeGroup==='FAQs')message='Review ages, supervision, prices, and cancellation terms before publishing your final answers.';
 if(activeGroup==='Testimonials')message='Add real, approved testimonials and attribution. Turn on Show this testimonial only when you have permission to publish it.';
 if(activeGroup==='Company support')message='Review the support options and enquiry wording. The contact button uses your company email in Links & Contact.';
 if(['Signups','Google Form'].includes(activeGroup)&&!state.links.googleForm)message='Google Form / Google Sheets: Google sign-in and the published form link are still needed. In Events, choose External registration and paste that form link. Built-in requests remain in Signups.';
 el.textContent=message?'Need extra info — '+message:'';
}
function filterEditorSections(){
 const input=$('#editor-search');if(!input)return;const q=input.value.trim().toLowerCase();let count=0;
 for(const button of document.querySelectorAll('#editor-tabs button')){const group=button.textContent;const words=[group,help[group]||'',...fields.filter(f=>f.group===group).map(f=>f.label)].join(' ').toLowerCase();button.hidden=!!q&&!words.includes(q);if(!button.hidden)count++;}
 const note=$('#editor-search-note');note.hidden=!q;note.textContent=count?count+' matching sections':'No sections found. Try “photos”, “events”, or “email”.';
}
$('#editor-search').addEventListener('input',filterEditorSections);

help['Google Form']='Edit the /signup subpage introduction and responder link. Change the actual form questions using Edit bilingual form; Google saves those changes automatically. Website text changes use Save draft and Publish changes.';
let translationDefaults=null;
help['中文內容']='在這裡自行撰寫或修改全站繁體中文內容。上方顯示英文原文，下方可直接輸入中文。尚未翻譯的內容會標示「需要補充中文」。修改後請按 Save draft 儲存草稿，再按 Publish changes 發布；不需要外部翻譯服務。';
async function renderLanguages(area){
 state.translations??={};const loading=document.createElement('p');loading.textContent='Loading translation fields…';area.append(loading);
 try{translationDefaults??=await fetch('/i18n-data.json').then(r=>r.json());}catch{loading.textContent='Translations could not be loaded. Please reopen this section.';return;}
 if(activeGroup!=='中文內容')return;loading.remove();
 const sources=new Map();const skip=new Set(['id','src','eventId','startDate','endDate','date','mapEmbed','registrationUrl','signupMode','status','email','url','links','contact','translations','interfaceText','nextWorkshop']);
 function collect(value,path=''){if(typeof value==='string'&&value.trim()&&!/^https?:|^\/|^[\d+—.,%\s]+$/.test(value))sources.set(value.trim(),path);else if(Array.isArray(value))value.forEach((v,i)=>collect(v,path+' '+(i+1)));else if(value&&typeof value==='object')for(const [key,v]of Object.entries(value))if(!skip.has(key))collect(v,(path+' / '+key).trim());}
 collect(state);for(const source of Object.keys(translationDefaults))if(!sources.has(source))sources.set(source,'Website interface');
 const search=document.createElement('input');search.type='search';search.placeholder='搜尋英文或中文內容';search.setAttribute('aria-label','Search translations');search.className='translation-search';area.append(search);
 const onlyMissing=document.createElement('label');onlyMissing.className='checkbox-field';const toggle=document.createElement('input');toggle.type='checkbox';onlyMissing.append(toggle,document.createTextNode('只顯示需要補充中文'));area.append(onlyMissing);const list=document.createElement('div');area.append(list);let missing=0;
 for(const [source,path]of sources){const card=collectionCard(path);const original=document.createElement('p');original.className='translation-source';original.textContent=state.interfaceText?.[source]??source;card.append(original);const value=state.translations[source]??translationDefaults[source]??'';card.dataset.missing=String(!value);if(!value){missing++;const note=document.createElement('p');note.className='need-info';note.textContent='需要補充中文 · Need extra info';card.append(note);}card.append(fieldControl({label:'繁體中文',value,max:20000,multiline:true,rows:3,onInput:value=>{if(value.trim())state.translations[source]=value;else delete state.translations[source];changed();}}));list.append(card);}
 const note=document.createElement('p');note.textContent=missing?missing+' 項需要補充中文。您也可以自行修改現有譯文。':'所有列出的文字都有中文譯文，您可在下方自行修改。';area.insertBefore(note,search);
 const filter=()=>{const q=search.value.toLowerCase();for(const card of list.children)card.hidden=toggle.checked&&card.dataset.missing!=='true'||!((card.textContent+' '+card.querySelector('textarea')?.value).toLowerCase().includes(q));};search.addEventListener('input',filter);toggle.addEventListener('change',filter);
}
help['Next workshop']='Choose a published upcoming event to feature under Join a workshop. Choose None to hide the entire space. Past, hidden, or closed events are automatically omitted.';
function renderNextWorkshop(area){state.nextWorkshop??={eventId:''};area.append(selectField('Next workshop',state.nextWorkshop.eventId,[['','None — hide this space'],...state.events.map(e=>[e.id,e.title+(e.visible?'':' (hidden)')])],value=>{state.nextWorkshop.eventId=value;changed();}));const note=document.createElement('p');note.className='section-help';note.textContent='Edit dates, description, venue, and the Google Form registration link in Events. This section only appears while the selected event is visible, upcoming, and open.';area.append(note);}
help['Interface text']='Edit English labels, navigation text, footer text, policy copy, and messages. Main page content stays in its named section. Use 中文內容 for Chinese wording.';
async function renderInterfaceEditor(area){state.interfaceText??={};translationDefaults??=await fetch('/i18n-data.json').then(r=>r.json());if(activeGroup!=='Interface text')return;const search=document.createElement('input');search.className='translation-search';search.type='search';search.placeholder='Search labels, buttons, or policy text';search.setAttribute('aria-label','Search interface text');area.append(search);const list=document.createElement('div');area.append(list);for(const source of Object.keys(translationDefaults)){const card=collectionCard(source.length>70?source.slice(0,70)+'…':source);card.append(fieldControl({label:'English text',value:state.interfaceText[source]??source,multiline:source.length>100,format:false,max:20000,onInput:value=>{if(value.trim()&&value!==source)Object.defineProperty(state.interfaceText,source,{value,enumerable:true,writable:true,configurable:true});else delete state.interfaceText[source];changed();}}));list.append(card);}search.oninput=()=>{for(const card of list.children)card.hidden=!(card.textContent+' '+card.querySelector('input,textarea')?.value).toLowerCase().includes(search.value.toLowerCase());};}
help['Our Mission']='Edit the statement on the separate /mission page. The homepage and team page show a short link to it.';
help['Our Programs']='Edit the lesson introduction and the bright planning area. Add next-month lessons in Timeline and registration forms in Events.';
help.Timeline='Add lesson plans for the next 31 days to appear under Our Programs. Older milestones remain in the impact history. Add locations, mark provisional plans, and link events for registration.';
help.Testimonials='Add real testimonials with approved attribution. Hidden drafts are never shown publicly. Up to 30 reviews; the first two published reviews appear before the FAQ.';
help['Company support']='Edit the company donation and partnership enquiry page. Contact opens the visitor’s Gmail addressed to your company.';
help.Footer='Edit the compact footer, social link labels, and closing text. Destinations are in Links & Contact.';
help.Gallery='Upload and reorder photos. Hearts are decorative and saved only in each visitor’s browser; there are no public counts.';
help['Next workshop']='Optionally feature one open upcoming event above the program timeline. Choose None to omit it.';
function renderTestimonialEditor(area){state.testimonials??=[];for(const [index,item]of state.testimonials.entries()){const card=collectionCard(item.name||'New testimonial');card.append(checkboxControl('Show this testimonial — approved for publication',item.visible,value=>{item.visible=value;changed();}));for(const [key,label,max]of [['quote','Testimonial',4000],['name','Approved name / attribution',160],['context','Role, school, or workshop (optional)',250]])card.append(fieldControl({label,value:item[key],max,multiline:key==='quote',onInput:value=>{item[key]=value;changed();}}));collectionControls(state.testimonials,index,card);area.append(card);}const add=action('Add testimonial',()=>{state.testimonials.push({id:crypto.randomUUID(),quote:'',name:'',context:'',visible:false});changed();renderFields();});add.disabled=state.testimonials.length>=30;area.append(add);}

function renderHeaderEditor(area){
 state.navigation??=structuredClone(defaults.navigation);
 const logo=document.createElement('img');logo.src=state.links.headerLogo;logo.alt=state.text.headerLogoAlt;logo.width=100;logo.height=100;logo.style.objectFit='contain';area.append(logo,photoUpload('Upload header logo (converted to JPEG)',src=>{state.links.headerLogo=src;}),action('Use original vector logo',()=>{state.links.headerLogo=defaults.links.headerLogo;changed();renderFields();}));
 function editLink(item,container){container.append(fieldControl({label:'Label',value:item.label,max:70,onInput:value=>{item.label=value;changed();}}),fieldControl({label:'Destination',value:item.url,max:2000,hint:'Use /events for a page or a complete https:// URL for an external resource. A group with children opens its dropdown; its destination is used when it has no children.',onInput:value=>{item.url=value;changed();}}));}
 for(const [index,item] of state.navigation.entries()){
  const card=collectionCard('Menu item '+(index+1));editLink(item,card);collectionControls(state.navigation,index,card);
  for(const [i,child]of item.children.entries()){const box=collectionCard('Dropdown link '+(i+1));editLink(child,box);collectionControls(item.children,i,box);card.append(box);}
  const add=action('Add dropdown link',()=>{item.children.push({label:'New link',url:'/events'});changed();renderFields();});add.disabled=item.children.length>=10;card.append(add);area.append(card);
 }
 const add=action('Add menu item',()=>{state.navigation.push({label:'New menu',url:'/events',children:[]});changed();renderFields();});add.disabled=state.navigation.length>=6;area.append(add);
}
