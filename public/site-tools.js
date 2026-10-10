(()=>{
 document.documentElement.dataset.theme='light';try{localStorage.removeItem('lst-theme');}catch{}
 function closeModal(dialog){
  if(!dialog.open||dialog.classList.contains('closing'))return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){dialog.close();return;}
  dialog.classList.add('closing');setTimeout(()=>{dialog.close();dialog.classList.remove('closing');},170);
 }
 function animateDialog(dialog){dialog.addEventListener('cancel',event=>{event.preventDefault();closeModal(dialog);});dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal(dialog);});}
 function init(){
 document.querySelectorAll('.tools-dialog,.site-tools').forEach(el=>el.remove());
 const admin=!!document.querySelector('#editor-tabs');
 const bar=document.createElement('div');bar.className='site-tools';bar.setAttribute('aria-label','Website tools');
 const menu=document.createElement('button');menu.type='button';menu.textContent=admin?'Editor menu':'Menu';menu.setAttribute('aria-expanded','false');bar.append(menu);menu.classList.add('header-menu-trigger');
 const dialog=document.createElement('dialog');dialog.className='tools-dialog';dialog.id='site-menu-dialog';dialog.setAttribute('aria-label',admin?'Editor menu':'Website menu');menu.setAttribute('aria-controls',dialog.id);
 const close=document.createElement('button');close.type='button';close.innerHTML='<span aria-hidden="true">×</span>';close.setAttribute('aria-label','Close menu');close.className='dialog-close icon-close';close.onclick=()=>closeModal(dialog);dialog.append(close);
 const heading=document.createElement('h2');heading.textContent=admin?'Editor sections':'Explore';dialog.append(heading);
 const nav=document.createElement('div');nav.className='tools-links';dialog.append(nav);
 function fillMenu(){nav.replaceChildren();if(admin){document.querySelectorAll('#editor-tabs button').forEach(original=>{const button=document.createElement('button');button.textContent=original.textContent;button.onclick=()=>{original.click();closeModal(dialog);document.querySelector('#section-title').scrollIntoView({block:'center'});};nav.append(button);});}else{const source=document.querySelector('#main-nav');for(const item of source?.children||[]){const copy=item.cloneNode(true);copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));copy.removeAttribute('id');nav.append(copy);}nav.querySelectorAll('a').forEach(a=>a.onclick=()=>closeModal(dialog));}}
 menu.onclick=()=>{fillMenu();dialog.showModal();menu.setAttribute('aria-expanded','true');};dialog.addEventListener('close',()=>{menu.setAttribute('aria-expanded','false');menu.focus();});document.body.append(dialog);animateDialog(dialog);
 if(!admin){
 const language=document.createElement('button');language.type='button';language.className='language-switch';language.textContent=document.documentElement.lang==='zh-Hant'?'EN / 中文':'EN / 中文';language.setAttribute('aria-label',document.documentElement.lang==='zh-Hant'?'Switch to English':'切換至繁體中文');language.onclick=()=>window.lstSetLanguage?.(document.documentElement.lang==='zh-Hant'?'en':'zh');language.setAttribute('role','switch');language.setAttribute('aria-checked',String(document.documentElement.lang==='zh-Hant'));bar.prepend(language);
 const search=document.createElement('button');search.type='button';search.className='search-trigger';search.setAttribute('aria-label','Search');search.title='Search';search.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';bar.insertBefore(search,menu);
 const sd=document.createElement('dialog');sd.className='tools-dialog';sd.setAttribute('aria-labelledby','search-heading');sd.innerHTML='<button type="button" class="dialog-close icon-close" aria-label="Close search"><span aria-hidden="true">×</span></button><h2 id="search-heading">Search · 搜尋</h2><form role="search"><label for="site-query">Programs, lessons, team, or FAQs</label><div class="search-row"><input id="site-query" type="search" maxlength="120" required autocomplete="off"><button type="submit">Search</button></div></form><p class="search-status" role="status"></p><div class="search-results"></div>';
 sd.querySelector('.dialog-close').onclick=()=>closeModal(sd);sd.addEventListener('close',()=>search.focus());search.onclick=()=>{sd.showModal();sd.querySelector('input').focus();};
 let searchRequest=0;sd.querySelector('form').onsubmit=async e=>{e.preventDefault();const id=++searchRequest,q=sd.querySelector('input').value.trim(),status=sd.querySelector('.search-status'),results=sd.querySelector('.search-results');results.replaceChildren();if(!q){status.textContent='Enter a word to search.';return;}status.textContent='Searching…';try{const response=await fetch('/api/search?lang='+(document.documentElement.lang==='zh-Hant'?'zh':'en')+'&q='+encodeURIComponent(q));if(!response.ok)throw Error();const data=await response.json();if(id!==searchRequest)return;status.textContent=data.results.length?(document.documentElement.lang==='zh-Hant'?data.results.length+' 筆結果':data.results.length+' results'):'No matches. Try a different word.';for(const item of data.results){const a=document.createElement('a');a.href=item.url;const title=document.createElement('strong');title.textContent=item.title;const text=document.createElement('p');text.textContent=item.text;a.append(title,text);a.onclick=()=>closeModal(sd);results.append(a);}}catch{if(id===searchRequest)status.textContent='Search is unavailable. Please try again.';}};document.body.append(sd);animateDialog(sd);
 }
 const header=document.querySelector('header');if(header){header.append(bar);const cta=header.querySelector('.nav-cta');if(cta){cta.classList.add('header-workshop');header.append(cta);}}else document.body.prepend(bar);
 window.lstHeaderObserver?.disconnect();
 if(header?.classList.contains('unified-header')){const measure=()=>document.documentElement.style.setProperty('--site-header-height',header.getBoundingClientRect().height+'px');measure();window.lstHeaderObserver=new ResizeObserver(measure);window.lstHeaderObserver.observe(header);}
 }
 document.addEventListener('click',event=>{document.querySelectorAll('.unified-header .header-dropdown[open]').forEach(item=>{if(!item.contains(event.target)||event.target.closest('a'))item.open=false;});});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const item=document.querySelector('.unified-header .header-dropdown[open]');if(item){item.open=false;item.querySelector('summary').focus();}}});
 window.lstInitTools=init;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
