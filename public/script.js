window.lstInitHome=()=>{
window.lstHomeController?.abort();const controller=new AbortController();window.lstHomeController=controller;
window.lstCountObserver?.disconnect();
const countElements=[...document.querySelectorAll('[data-count-up]')];
function animateCount(el){if(el.dataset.counted)return;el.dataset.counted='true';const final=el.dataset.countUp;const match=final.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);if(!match||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const value=Number(match[2].replaceAll(',',''));if(!Number.isFinite(value))return;const decimals=(match[2].split('.')[1]||'').length;const start=performance.now();el.setAttribute('aria-label',final);const draw=time=>{if(!el.isConnected||controller.signal.aborted)return;const p=Math.min(1,(time-start)/1100),number=value*(1-(1-p)**3);el.textContent=p===1?final:match[1]+number.toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})+match[3];if(p<1)requestAnimationFrame(draw);};requestAnimationFrame(draw);}
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){animateCount(e.target);observer.unobserve(e.target);}},{threshold:.4});window.lstCountObserver=observer;countElements.forEach(el=>observer.observe(el));}else countElements.forEach(animateCount);
const menuButton = document.querySelector('.menu-toggle');
document.querySelectorAll('.faq-list details').forEach(details=>{
 const summary=details.querySelector('summary');let animation=null,expanded=details.open;
 summary.addEventListener('click',event=>{
  event.preventDefault();expanded=!expanded;
  const start=details.getBoundingClientRect().height;
  animation?.cancel();details.style.height=start+'px';details.style.overflow='hidden';
  details.open=true;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){details.open=expanded;details.style.height='';details.style.overflow='';return;}
  details.style.height='auto';
  const end=expanded?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+1;
  details.style.height=start+'px';
  animation=details.animate({height:[start+'px',end+'px']},{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});
  animation.onfinish=()=>{details.open=expanded;details.style.height='';details.style.overflow='';animation=null;};
 });
});
const mainNav = document.querySelector('#main-nav');
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
function closeMenu(){mainNav?.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');}
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';mainNav.classList.toggle('open',open);menuButton.setAttribute('aria-expanded',String(open));});
mainNav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mainNav?.classList.contains('open')){closeMenu();menuButton.focus();}},{signal:controller.signal});
if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('pending');observer.unobserve(entry.target);}});},{threshold:.08});document.querySelectorAll('.reveal').forEach(element=>{if(element.getBoundingClientRect().top>window.innerHeight){element.classList.add('pending');observer.observe(element);}});}
function centerStory(behavior='smooth'){
 const section=document.querySelector('#story');if(!section)return;const header=document.querySelector('.site-header')?.getBoundingClientRect().height||0;const available=innerHeight-header-24;const rect=section.getBoundingClientRect();const top=scrollY+rect.top-header-12-Math.max(0,(available-rect.height)/2);window.scrollTo({top:Math.max(0,top),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':behavior});
}
document.querySelectorAll('a[href]').forEach(link=>{const url=new URL(link.href,location.href);if(url.origin===location.origin&&url.pathname===location.pathname&&url.hash==='#story')link.addEventListener('click',event=>{event.preventDefault();closeMenu();history.pushState(null,'',url.pathname+url.search+url.hash);requestAnimationFrame(()=>centerStory());});});
if(location.hash==='#story')window.addEventListener('load',()=>centerStory('auto'),{once:true});

};
window.lstInitHome();
