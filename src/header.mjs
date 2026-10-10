import {escapeText as esc} from '../public/formatting.js';

export function defaultNavigation(content){return [
 {label:'About',url:'/mission',children:[{label:'Our Mission',url:'/mission'},{label:'Our Team',url:'/team'}]},
 {label:'Our Work',url:'/events',children:[{label:'Our Workshops',url:'/events'},{label:'Upcoming workshops',url:'/events?filter=upcoming'},{label:'Past workshops',url:'/events?filter=past'},{label:'Our Impact',url:'/impact'},{label:'Gallery',url:'/#gallery'}]},
 {label:'Get Involved',url:'/signup',children:[{label:'Company Support',url:'/donate'},{label:'Enquiries',url:'/signup'},{label:'Purchase Our Kits',url:'/kits'},{label:'Donations',url:'/donate#donations'}]},
 {label:'Resources',url:'/testimonials',children:[{label:'Testimonials',url:'/testimonials'},{label:'FAQs',url:'/#questions'}]},
 {label:'Contact Us',url:'/signup',children:[]}
 ];}
export function validateNavigation(items,validLink){
 if(!Array.isArray(items)||items.length>6)throw Error('Keep up to six header menu items.');
 const link=item=>{if(!item||typeof item.label!=='string'||!item.label.trim()||item.label.length>70||!validLink(item.url))throw Error('Each header item needs a label (up to 70 characters) and a safe link.');return {label:item.label.trim(),url:item.url};};
 return items.map(item=>{const clean=link(item);if(!Array.isArray(item.children)||item.children.length>10)throw Error('Keep up to ten links in each dropdown.');return {...clean,children:item.children.map(link)};});
}
export function renderHeader(content){
 const t=content.text;
 const link=(item,extra='')=>`<a href="${esc(item.url.startsWith('#')?'/'+item.url:item.url)}" ${extra}${item.url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':''}>${esc(item.label)}</a>`;
 const nav=(content.navigation||defaultNavigation(content)).map((item,i)=>item.children.length?`<details class="header-dropdown"><summary>${esc(item.label)}<span aria-hidden="true">⌄</span></summary><div class="header-dropdown-links" id="header-dropdown-${i}">${item.children.map(child=>link(child)).join('')}</div></details>`:link(item)).join('');
 return `<header class="site-header unified-header"><a class="brand" href="/" aria-label="${esc(t.headerBrand)} home"><img class="brand-logo" src="${esc(content.links.headerLogo)}" alt="${esc(t.headerLogoAlt)}" width="64" height="64"><span>${esc(t.headerBrand)}<small>${esc(t.headerTagline)}</small></span></a><nav id="main-nav" aria-label="Main navigation">${nav}</nav><a class="nav-cta" data-link="workshops" data-new-tab="true" target="_blank" rel="noopener noreferrer" href="${esc(content.links.workshops)}">${esc(t.headerButton)} <span aria-hidden="true">↗</span></a></header>`;
}
