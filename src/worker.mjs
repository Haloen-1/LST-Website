import {editorIdentity} from './access.mjs';
import {storePhoto,knownPhotos,readPhoto,PHOTO_LIMIT} from './photos.mjs';
import {languageFor,localizedContent,localizeResponse,interfaceDictionary} from './localization.mjs';
import {allowedOrigin} from './origins.mjs';
import {searchSite} from './search.mjs';
import {richText,plainText} from '../public/formatting.js';
import {renderMetrics,renderTeam,renderTimeline,timelineDetail,renderLocations,renderTestimonials} from './extended-content.mjs';
import {submitSignup,adminSignups} from './signups.mjs';
import {assets} from './generated-assets.mjs';
import {defaults,fields,mergeContent,validateContent,gmailLink,escapeHtml,jpegDimensions} from './content.mjs';
import {allPhotos,renderFaqs,renderGallery,renderEvents,renderEventDetail,renderNextWorkshop} from './collections.mjs';

const security={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...security,'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
const error=(message,status)=>json({error:message},status);
const responseHtml=(html,status=200)=>new Response(html.replace('</head>','<link rel="stylesheet" href="/site-tools.css"><link rel="stylesheet" href="/layout-update.css"><script src="/site-tools.js"></script></head>'),{status,headers:{...security,'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-src https://www.google.com https://maps.google.com https://docs.google.com; base-uri 'self'; form-action 'self'; object-src 'none'"}});
async function readBytes(request,max){
 if(Number(request.headers.get('content-length'))>max)throw Error('The upload or request is too large.');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('The upload or request is too large.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let p=0;for(const c of chunks){bytes.set(c,p);p+=c.length;}return bytes;
}
async function readRecord(env){return env.DB.prepare('SELECT draft_content, published_content, revision, updated_at, published_at FROM site_content WHERE id = ?').bind('site').first();}
function recordContent(record,draft=false){return mergeContent(record?.[draft?'draft_content':'published_content']?JSON.parse(record[draft?'draft_content':'published_content']):null);}
function renderPage(path,content,{preview=false,status=200,filter='all',event=null,timelineItem=null,lang='en'}={}){
 const asset=assets[path];if(!asset)return responseHtml('Page not found',404);
 let html=asset.text.replace(/<script src="\/(?:collections|script)\.js" defer><\/script>/g,'');
 if(timelineItem)html=html.replace(/<!-- PAGE CONTENT START -->[\s\S]*?<!-- PAGE CONTENT END -->/,()=>timelineDetail(timelineItem,content,preview)).replace(/<title>[^<]*<\/title>/,()=>'<title>'+escapeHtml(timelineItem.title)+' | Little Scientists Taipei</title>');
 if(path==='/events.html'&&event)html=html.replace('<!-- EVENTS CONTENT START -->'+html.split('<!-- EVENTS CONTENT START -->')[1].split('<!-- EVENTS CONTENT END -->')[0]+'<!-- EVENTS CONTENT END -->',renderEventDetail(event,preview)).replace('<title>Events | Little Scientists Taipei</title>','<title>'+escapeHtml(event.title)+' | Little Scientists Taipei</title>').replace('content="Browse Little Scientists Taipei workshops, past events, locations, and registration details."','content="'+escapeHtml(event.description.slice(0,155))+'"');
 if(preview)html=html.replace('<body>','<body><div class="draft-banner">Saved draft — only visible to you. <a href="/admin">Back to editor</a></div>').replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');
 const rewriter=new HTMLRewriter()
 .on('[data-google-form]',{element(el){try{const u=new URL(content.links.googleForm);if(u.protocol!=='https:'||u.hostname!=='docs.google.com'||!/^\/forms\/d\/(?:e\/)?[A-Za-z0-9_-]+\/viewform$/.test(u.pathname))return;u.search='?embedded=true';el.setInnerContent('<iframe class="google-form-frame" src="'+escapeHtml(u.href)+'" title="Workshop enquiries form / 活動洽詢表單" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>',{html:true});}catch{}}})
 .on('[data-team]' ,{element(el){el.setInnerContent(renderTeam(content),{html:true});}})
 .on('[data-timeline]',{element(el){el.setInnerContent(renderTimeline(content,preview),{html:true});}})
 .on('[data-program-timeline]',{element(el){el.setInnerContent(renderTimeline(content,preview,true),{html:true});}})
 .on('[data-locations]',{element(el){el.setInnerContent(renderLocations(content),{html:true});}})
 .on('[data-future]',{element(el){el.setInnerContent(richText(content.text.futureBody||'And more! We look forward to reaching more schools and locations.'),{html:true});}})
 .on('[data-testimonials]',{element(el){el.setInnerContent(renderTestimonials(content,el.getAttribute('data-testimonials')==='preview'),{html:true});}})
 .on('[data-next-workshop]',{element(el){const markup=renderNextWorkshop(content,preview);if(markup)el.setInnerContent(markup,{html:true});else el.remove();}})
 .on('[data-metrics]',{element(el){el.setInnerContent(renderMetrics(content),{html:true});}})
 
 .on('[data-faq-list]',{element(el){el.setInnerContent(renderFaqs(content),{html:true});}})
 .on('[data-gallery]',{element(el){el.setInnerContent(renderGallery(content,preview),{html:true});}})
 .on('[data-event-list]',{element(el){el.setInnerContent(renderEvents(content,filter,preview),{html:true});}})
 .on('[data-filter]',{element(el){const active=el.getAttribute('data-filter')===filter;el.setAttribute('aria-current',active?'page':'false');if(active)el.setAttribute('class','active');}})
 .on('[data-photo-caption]',{element(el){el.setInnerContent(richText(content.photos[el.getAttribute('data-photo-caption')]?.caption??''),{html:true});}})
 .on('[data-content]',{element(el){
   const key=el.getAttribute('data-content');if(!(key in content.text))return;
   let value=el.tagName==='title'?escapeHtml(plainText(content.text[key])):richText(content.text[key]);
   el.setInnerContent(value,{html:true});
 }})
 .on('[data-meta]',{element(el){el.setAttribute('content',content.text[el.getAttribute('data-meta')]??'');}})
 .on('[data-link]',{element(el){const link=content.links[el.getAttribute('data-link')];if(!link)return;el.setAttribute('href',link);if(link.startsWith('https:')||el.getAttribute('data-new-tab')==='true'){el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer');}else{el.removeAttribute('target');el.removeAttribute('rel');}}})
 .on('[data-contact]',{element(el){el.setAttribute('href',gmailLink(content.contact.email,el.getAttribute('data-subject')??undefined));el.setAttribute('target','_blank');el.setAttribute('rel','noopener');}})
 .on('[data-email]',{element(el){el.setInnerContent(content.contact.email);}})
 .on('[data-photo]',{element(el){const photo=content.photos[el.getAttribute('data-photo')];if(!photo)return;el.setAttribute('src',photo.src);el.setAttribute('alt',photo.alt);el.setAttribute('style',`object-position:${photo.x}% ${photo.y}%`);}})
 .on('a[href]',{element(el){const href=el.getAttribute('href');if(preview&&href?.startsWith('/')&&!href.startsWith('//')&&!href.startsWith('/admin')&&!href.startsWith('/sign')){const link=new URL(href,'https://preview.invalid');link.searchParams.set('preview','draft');el.setAttribute('href',link.pathname+link.search+link.hash);}}});
 return localizeResponse(rewriter.transform(responseHtml(html.replace('</head>','<script src="/collections.js" defer></script><script src="/script.js" defer></script><script type="module" src="/i18n.js"></script></head>'),status)),lang,content.translations,content.interfaceText);
}
function deniedPage(){return responseHtml('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Website Editor Access</title><link rel="stylesheet" href="/admin.css"><main class="access-message"><h1>This editor belongs to the site owner.</h1><p>This signed-in account is not on the website editor list. Signing in again with the same account will not change its access.</p><p>Signed in as: '+'an unverified or unauthorized account'+'</p><p>Use an authorized editor account. If this is your intended account, ask the site owner to add it to the editor list.</p><a class="primary" href="/cdn-cgi/access/logout">Switch account</a><a href="/">Back to the website</a></main></html>',403);}
const application={async fetch(request,env){
 const url=new URL(request.url),path=url.pathname,lang=languageFor(request);
 const identity=await editorIdentity(request,env),owner=!!identity;
 if(path.startsWith('/_templates/')||path==='/admin.html')return error('Page not found.',404);
 if(path.startsWith('/admin')&&!owner)return deniedPage();
 const render=async(path,content,options={})=>{
 const version=locale=>{const c=localizedContent(content,locale);return renderPage(path,c,{...options,lang:locale,event:options.event?c.events.find(e=>e.id===options.event.id):null,timelineItem:options.timelineItem?c.timeline.find(t=>t.id===options.timelineItem.id):null});};
 const enResponse=version('en'),zhResponse=version('zh');const [en,zh]=await Promise.all([enResponse.text(),zhResponse.text()]);
 const pack={en,zh,dictionary:interfaceDictionary(content.translations,content.interfaceText),english:content.interfaceText||{},links:content.links};
 const serialized=JSON.stringify(pack).replaceAll('<','\\u003c');const html=(lang==='zh'?zh:en).replace('</body>','<script type="application/json" id="lst-page-pack">'+serialized+'</script></body>');
 return new Response(html,{status:enResponse.status,headers:enResponse.headers});
 };
 try{
  if(path==='/api/language'&&request.method==='GET'){const preview=url.searchParams.get('preview')==='draft';if(preview&&!owner)return error('Sign in to preview translations.',403);return json(interfaceDictionary(recordContent(await readRecord(env),preview).translations));}
  if(path==='/api/search'&&request.method==='GET')return json({results:searchSite(localizedContent(recordContent(await readRecord(env)),lang),url.searchParams.get('q'))});
  if(path==='/api/signup')return await submitSignup(request,env,recordContent(await readRecord(env)));
  if(path.startsWith('/api/timeline'))return error('Timeline reactions are no longer available.',410);
  if(path.startsWith('/api/gallery'))return error('Photo likes are now saved only in your browser.',410);
  if(path==='/admin'||path==='/admin/'){
   const response=responseHtml(assets['/admin.html'].text);response.headers.set('X-Frame-Options','DENY');response.headers.set('Content-Security-Policy',response.headers.get('Content-Security-Policy')+"; frame-ancestors 'none'");return response;
  }
  if(path.startsWith('/api/editor')){
   if(!owner)return error('Sign in through Cloudflare Access with an authorized editor account.',401);
   if(['/api/editor/signups','/api/editor/signups.csv'].includes(path)&&request.method==='GET')return await adminSignups(request,env);
   if(path==='/api/editor'&&request.method==='GET'){
    const record=await readRecord(env);return json({content:recordContent(record,true),revision:record?.revision??0,publishedAt:record?.published_at??null,fields,defaults,previewUrl:'/?preview=draft'});
   }
   if(request.method!=='POST')return error('Method not allowed.',405);
   if(!allowedOrigin(request,env)||request.headers.get('x-lst-editor')!=='1')return error('This change must be made from your website editor.',403);
   if(path==='/api/editor/upload'){
    if(request.headers.get('content-type')!=='image/jpeg')return error('Upload a JPEG photo prepared by the editor.',415);
    const bytes=await readBytes(request,PHOTO_LIMIT),dimensions=jpegDimensions(bytes);
    if(!dimensions||dimensions.width>6000||dimensions.height>6000||dimensions.width*dimensions.height>24000000)return error('Choose a valid photo smaller than 6000 pixels on either side.',400);
    return json({src:await storePhoto(env,bytes)});
   }
   if(path==='/api/editor/save'||path==='/api/editor/publish'){
    if(!request.headers.get('content-type')?.startsWith('application/json'))return error('Send website content as JSON.',415);
    let payload;try{payload=JSON.parse(new TextDecoder().decode(await readBytes(request,1000000)));}catch{return error('The content could not be read. Please try again with valid website content.',400);}
    if(!Number.isInteger(payload.revision)||payload.revision<0)return error('Reload the editor before saving.',400);
    let content;try{content=validateContent(payload.content);}catch(e){return error(e.message,400);}
    if(!await knownPhotos(env,allPhotos(content).map(p=>p.src)))return error('A selected photo has no upload record. Upload it again before saving.',400);
    const value=JSON.stringify(content),now=new Date().toISOString(),publish=path.endsWith('/publish');let result;
    if(payload.revision===0){result=await env.DB.prepare('INSERT INTO site_content (id, draft_content, published_content, revision, updated_at, published_at) VALUES (?, ?, ?, 1, ?, ?) ON CONFLICT(id) DO NOTHING RETURNING revision').bind('site',value,publish?value:null,now,publish?now:null).first();}
    else if(publish){result=await env.DB.prepare('UPDATE site_content SET draft_content = ?, published_content = ?, revision = revision + 1, updated_at = ?, published_at = ? WHERE id = ? AND revision = ? RETURNING revision').bind(value,value,now,now,'site',payload.revision).first();}
    else{result=await env.DB.prepare('UPDATE site_content SET draft_content = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ? RETURNING revision').bind(value,now,'site',payload.revision).first();}
    if(!result)return error('This website was changed in another editor tab. Your changes are still here; open a new editor tab to compare before trying again.',409);
    return json({revision:result.revision,published:publish,updatedAt:now});
   }
   return error('Editor action not found.',404);
  }
  if(path.startsWith('/media/')){
   if(!/^\/media\/[a-f0-9-]{36}\.jpg$/.test(path))return error('Photo not found.',404);
   const content=recordContent(await readRecord(env));
   if(!owner&&!allPhotos(content).some(photo=>photo.src===path))return error('Photo not found.',404);
   const object=await readPhoto(env,path.slice(7));if(!object){const response=error('Photo is still propagating. Please retry shortly.',503);response.headers.set('Retry-After','5');return response;}
   return new Response(object.body,{headers:{...security,'Content-Type':'image/jpeg','Cache-Control':owner?'private,no-store':'public,max-age=60','ETag':object.etag||''}});
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return error('Method not allowed.',405);
  if(path==='/robots.txt')return new Response('User-agent: *\n'+(env.STAGING==='true'?'Disallow: /':'Allow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: '+env.PUBLIC_ORIGIN+'/sitemap.xml'),{headers:{'Content-Type':'text/plain'}});
  if(path==='/sitemap.xml'){
   const content=recordContent(await readRecord(env)),origin=env.PUBLIC_ORIGIN;
   const paths=['/','/signup','/mission','/impact','/testimonials','/donate','/events','/team','/timeline','/cookies','/science-camp.html','/privacy.html',...content.events.filter(e=>e.visible).map(e=>'/events/'+e.id),...content.timeline.filter(t=>t.visible).map(t=>'/timeline/'+t.id)];
   return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>'+escapeHtml(origin+p)+'</loc></url>').join('')+'</urlset>',{headers:{...security,'Content-Type':'application/xml;charset=utf-8','Cache-Control':'no-cache'}});
  }
  if(['/workshops','/workshops/','/workshops.html'].includes(path)){url.pathname='/events';return Response.redirect(url.href,302);}
  if(path==='/admin.html')return error('Page not found.',404);
  if(path==='/events'||path==='/events/'||path==='/events.html'||path.startsWith('/events/')){
   const preview=url.searchParams.get('preview')==='draft';if(preview&&!owner)return error('Sign in as the site owner to preview your draft.',403);
   const content=recordContent(await readRecord(env),preview),id=path.startsWith('/events/')?path.slice(8):'',event=id?content.events.find(e=>e.id===id&&(e.visible||preview)):null;
   if(id&&!event)return render('/404.html',content,{status:404});
   const filter=['all','past','upcoming'].includes(url.searchParams.get('filter'))?url.searchParams.get('filter'):'all';
   return render('/events.html',content,{preview,filter,event});
  }
  if(path.startsWith('/timeline/')){
   const preview=url.searchParams.get('preview')==='draft';if(preview&&!owner)return error('Sign in as the site owner to preview your draft.',403);const content=recordContent(await readRecord(env),preview),item=content.timeline.find(t=>t.id===path.slice(10)&&(t.visible||preview));return item?render('/timeline.html',content,{preview,timelineItem:item}):render('/404.html',content,{status:404});
  }
  const routes={'/mission':'/mission.html','/mission.html':'/mission.html','/impact':'/impact.html','/impact.html':'/impact.html','/testimonials':'/testimonials.html','/testimonials.html':'/testimonials.html','/donate':'/donate.html','/donate.html':'/donate.html','/signup':'/signup.html','/signup.html':'/signup.html','/team':'/team.html','/team.html':'/team.html','/timeline':'/timeline.html','/timeline.html':'/timeline.html','/cookies':'/cookies.html','/cookies.html':'/cookies.html','/':'/index.html','/index.html':'/index.html','/workshops':'/workshops.html','/workshops/':'/workshops.html','/workshops.html':'/workshops.html','/science-camp.html':'/science-camp.html','/privacy.html':'/privacy.html','/404.html':'/404.html'};
  if(routes[path]){
   const preview=url.searchParams.get('preview')==='draft';if(preview&&!owner)return error('Sign in as the site owner to preview your draft.',403);
   const content=recordContent(await readRecord(env),preview);return render(routes[path],content,{preview,status:path==='/404.html'?404:200});
  }
  const asset=await env.ASSETS.fetch(request);if(asset.status!==404)return asset;
  return render('/404.html',defaults,{status:404});
 }catch(e){console.error('Website request failed',path,e instanceof Error?e.message:'Unknown error');return error('The website service is temporarily unavailable. Your saved content has not been changed. Please try again.',503);}
}};

export default {async fetch(request,env){const response=await application.fetch(request,env);if(env.STAGING==='true'){const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex, nofollow');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}return response;}};
