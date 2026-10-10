let pack=JSON.parse(document.querySelector('#lst-page-pack')?.textContent||'null');
let lang=document.documentElement.lang==='zh-Hant'?'zh':'en';
const parser=new DOMParser(),cache=new Map(),pending=new Map();let navigation=0,uiOriginal=new WeakMap(),uiAttributes=new WeakMap();
const pageKey=url=>{const u=new URL(url,location.href);u.hash='';u.searchParams.delete('lang');return u.pathname+u.search;};
const parse=html=>parser.parseFromString(html,'text/html');
const tr=text=>lang==='zh'?(pack?.dictionary[text]||text):(pack?.english[text]||text);
window.lstTranslate=tr;
function patch(current,next){
 if(current.nodeType!==next.nodeType||current.nodeName!==next.nodeName){current.replaceWith(next.cloneNode(true));return;}
 if(current.nodeType===3){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
 if(current.nodeType!==1)return;
 for(const name of ['alt','aria-label','placeholder','title','data-alt','data-caption'])if(next.hasAttribute(name))current.setAttribute(name,next.getAttribute(name));
 // Retain visitor input, disclosure state, carousel position, and like counts.
 if(current.matches('input,textarea,select,iframe,.like-button,.gallery-status,.signup-status,[data-gallery-position]'))return;
 if(current.matches('[data-content],[data-photo-caption],.faq-answer,.team-bio,.mission-copy,.lesson-copy,.event-description,.timeline-summary')){if(current.innerHTML!==next.innerHTML)current.innerHTML=next.innerHTML;return;}
 const a=[...current.childNodes],b=[...next.childNodes];if(a.length!==b.length){current.replaceChildren(...b.map(n=>n.cloneNode(true)));return;}a.forEach((node,i)=>patch(node,b[i]));
}
function translateUI(root){
 if(root.nodeType===3){const text=root.textContent,key=text.trim();if(!key)return;let original=uiOriginal.get(root);if(!original)original=key;uiOriginal.set(root,original);const translated=tr(original);if(translated!==key)root.textContent=text.replace(key,()=>translated);return;}
 if(root.nodeType!==1||root.matches('[data-no-translate],script,style,.language-switch'))return;
 const attrs=uiAttributes.get(root)||{};for(const name of ['aria-label','title','placeholder'])if(root.hasAttribute(name)){attrs[name]??=root.getAttribute(name);root.setAttribute(name,tr(attrs[name]));}uiAttributes.set(root,attrs);for(const child of root.childNodes)translateUI(child);
}
function updateUI(){
 document.querySelectorAll('.site-tools,.tools-dialog,.gallery-status,.signup-status').forEach(translateUI);
 document.querySelectorAll('.like-button').forEach(button=>{const label=button.querySelector('.like-label');if(label)label.textContent=tr(button.getAttribute('aria-pressed')==='true'?'Liked':'Like');});
 document.querySelectorAll('.language-switch').forEach(button=>{button.textContent=lang==='zh'?'EN / 中文':'EN / 中文';button.setAttribute('aria-checked',String(lang==='zh'));button.setAttribute('aria-label',lang==='zh'?'Switch to English':'切換至繁體中文');});
}
window.lstSetLanguage=next=>{
 if(!pack||!['en','zh'].includes(next))return;lang=next;const target=parse(pack[lang]),active=document.activeElement;
 for(const selector of ['main','footer','.skip-link','.mobile-cta']){const current=document.querySelector(selector),other=target.querySelector(selector);if(current&&other)patch(current,other);}
 const header=document.querySelector('header'),otherHeader=target.querySelector('header');if(header&&otherHeader){header.replaceChildren(...otherHeader.childNodes);window.lstInitTools?.();}
 document.documentElement.lang=lang==='zh'?'zh-Hant':'en';document.title=target.title;document.cookie='lst_language='+lang+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState({lst:true},'',url);updateUI();if(active?.isConnected)active.focus({preventScroll:true});updateProgress();
};
const progress=document.createElement('div');progress.className='scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
const loading=document.createElement('div');loading.className='page-loading';loading.setAttribute('role','status');loading.hidden=true;document.body.append(loading);let frame=false;
function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;const fraction=max>0?Math.min(1,Math.max(0,scrollY/max)):0;progress.style.width=Math.max(0,(document.documentElement.clientWidth-10)*fraction)+'px';progress.style.transform='none';}
addEventListener('scroll',()=>{if(!frame){frame=true;requestAnimationFrame(()=>{frame=false;updateProgress();});}},{passive:true});addEventListener('resize',updateProgress);new ResizeObserver(updateProgress).observe(document.body);
function eligible(url){return url.origin===location.origin&&!url.searchParams.has('preview')&&!/^\/(?:admin|api|signin|signout|media|assets)(?:\/|-|$)/.test(url.pathname)&&!url.pathname.match(/\.(?:pdf|csv|jpg|png|svg|zip)$/i);}
function obtain(url){
 const key=pageKey(url),entry=cache.get(key);if(entry&&Date.now()-entry.time<30000)return Promise.resolve(entry.pack);if(pending.has(key))return pending.get(key);
 const promise=fetch(key,{headers:{'X-LST-Navigation':'1'}}).then(async r=>{if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw Error('Page unavailable');const doc=parse(await r.text()),data=JSON.parse(doc.querySelector('#lst-page-pack')?.textContent||'null');if(!data)throw Error('Normal navigation required');cache.set(key,{pack:data,time:Date.now()});if(cache.size>10)cache.delete(cache.keys().next().value);return data;}).finally(()=>pending.delete(key));pending.set(key,promise);return promise;
}
function warmLinks(){
 if(location.search.includes('preview=')||navigator.connection?.saveData)return;const urls=[...document.querySelectorAll('header a[href],main a[href]')].map(a=>new URL(a.href)).filter(u=>eligible(u)&&pageKey(u)!==pageKey(location.href));const unique=[...new Map(urls.map(u=>[pageKey(u),u])).values()].slice(0,4);
 const warm=async()=>{for(const url of unique){try{await obtain(url);}catch{}}};if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:1800});else setTimeout(warm,700);
}
async function navigate(url,mode='push'){
 const ticket=++navigation;loading.textContent=tr('Loading page…');loading.hidden=false;
 try{
  const next=await obtain(url);if(ticket!==navigation)return;const target=parse(next[lang]);
  const currentList=document.querySelector('[data-event-list]'),nextList=target.querySelector('[data-event-list]');
  if(currentList&&nextList){
   const position={top:scrollY,left:scrollX,behavior:'instant'};
   currentList.replaceChildren(...nextList.childNodes);
   for(const link of document.querySelectorAll('[data-filter]')){const other=target.querySelector('[data-filter="'+CSS.escape(link.dataset.filter)+'"]');if(other){link.className=other.className;link.setAttribute('aria-current',other.getAttribute('aria-current')||'false');}}
   pack=next;window.lstPageLinks=pack.links;document.title=target.title;document.querySelector('#lst-page-pack')?.remove();url.searchParams.set('lang',lang);if(mode==='push')history.pushState({lst:true},'',url);
   document.querySelector('[data-filter][aria-current="page"]')?.focus({preventScroll:true});window.scrollTo(position);updateProgress();warmLinks();return;
  }
  for(const link of target.querySelectorAll('link[rel=stylesheet]'))if(!document.querySelector('link[href="'+CSS.escape(link.getAttribute('href'))+'"]'))document.head.append(link.cloneNode(true));
  const main=target.querySelector('main'),header=target.querySelector('header'),footer=target.querySelector('footer');if(!main||!header)throw Error('Invalid page');
  document.querySelector('.photo-dialog')?.close();document.querySelectorAll('.photo-dialog,.tools-dialog,.site-tools').forEach(n=>n.remove());document.querySelector('main').replaceWith(main);if(footer)document.querySelector('footer')?.replaceWith(footer);
  const photoDialog=target.querySelector('.photo-dialog');if(photoDialog&&!document.querySelector('.photo-dialog'))document.body.append(photoDialog);
  document.querySelector('.mobile-cta')?.remove();const mobileCta=target.querySelector('.mobile-cta');if(mobileCta)document.body.append(mobileCta);
  pack=next;window.lstPageLinks=pack.links;uiOriginal=new WeakMap();uiAttributes=new WeakMap();const skip=target.querySelector('.skip-link');if(skip)document.querySelector('.skip-link')?.replaceWith(skip);document.title=target.title;document.documentElement.lang=lang==='zh'?'zh-Hant':'en';document.querySelector('#lst-page-pack')?.remove();url.searchParams.set('lang',lang);if(mode==='push')history.pushState({lst:true},'',url);
  window.lstInitTools?.();window.lstInitHome?.();window.lstInitCollections?.();updateUI();
  const anchor=url.hash&&document.getElementById(decodeURIComponent(url.hash.slice(1)));if(anchor)anchor.scrollIntoView({block:'start',behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});main.tabIndex=-1;main.focus({preventScroll:true});updateProgress();warmLinks();
 }catch{if(ticket===navigation)location.assign(url);}finally{if(ticket===navigation)loading.hidden=true;}
}
document.addEventListener('click',event=>{
 const a=event.target.closest?.('a[href]');if(!a||a.target==='_blank'||a.hasAttribute('download')||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const url=new URL(a.href);if(!eligible(url)||location.search.includes('preview='))return;
 if(a.matches('[data-filter]')&&pageKey(url)===pageKey(location.href)){event.preventDefault();return;}
 if(pageKey(url)===pageKey(location.href)){if(url.hash){event.preventDefault();history.pushState({lst:true},'',url);document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}return;}event.preventDefault();navigate(url);
});
document.addEventListener('pointerover',event=>{const a=event.target.closest?.('a[href]');if(!a||a.target==='_blank'||location.search.includes('preview=')||navigator.connection?.saveData)return;const url=new URL(a.href);if(eligible(url)&&pageKey(url)!==pageKey(location.href)&&pending.size<3)obtain(url).catch(()=>{});},{passive:true});
addEventListener('popstate',()=>{const url=new URL(location.href);if(url.searchParams.has('lang'))lang=url.searchParams.get('lang')==='zh'?'zh':'en';navigate(url,'pop');});
const observer=new MutationObserver(records=>{observer.disconnect();for(const record of records)for(const node of record.addedNodes)if(node.matches?.('.tools-dialog,.site-tools')||node.parentElement?.closest('.tools-dialog,.site-tools,.gallery-status,.signup-status'))translateUI(node);observer.observe(document.body,{childList:true,subtree:true});});
if(pack){window.lstPageLinks=pack.links;cache.set(pageKey(location.href),{pack,time:Date.now()});updateUI();warmLinks();observer.observe(document.body,{childList:true,subtree:true});}updateProgress();
