import {plainText} from '../public/formatting.js';
export function searchSite(content,query){
 const q=String(query||'').trim().toLocaleLowerCase().slice(0,120);if(!q)return [];
 const entries=[{title:content.text.kitsTitle,url:"/kits",text:content.text.kitsIntro},...(content.kits||[]).filter(k=>k.visible).map(k=>({title:k.title,url:"/kits#kit-"+k.id,text:k.description+" "+k.price})),
 {title:content.text.missionTitle,url:'/mission',text:content.text.missionBody},
 {title:content.text.impactTitle,url:'/impact',text:content.text.impactIntro+' '+content.text.impactLocations+' '+content.text.futureBody},
 {title:content.text.testimonialsTitle,url:'/testimonials',text:content.text.testimonialsIntro+' '+(content.testimonials||[]).filter(t=>t.visible).map(t=>t.quote+' '+t.name).join(' ')},
 {title:content.text.donationTitle,url:'/donate',text:content.text.donationIntro+' '+content.text.donationBody},
  {title:content.text.formTitle,url:"/signup",text:content.text.formIntro+" email Google Form registration signup 報名 電子郵件"},
  {title:'Our Programs · 活動',url:'/events',text:content.text.eventsIntro||'Past and upcoming science workshops'},
  {title:'Our Story · 關於我們',url:'/team#mission',text:content.text.storyParagraph1+' '+content.text.storyParagraph2},
  {title:'Our Team · 團隊',url:'/team#officers',text:content.team.filter(m=>m.visible).map(m=>m.name+' '+m.bio).join(' ')},
  ...content.events.filter(e=>e.visible).map(e=>({title:e.title,url:'/events/'+e.id,text:[e.description,e.venue,e.address,e.ageGroup,e.startDate].join(' ')})),
  ...content.timeline.filter(t=>t.visible).map(t=>({title:t.title,url:'/timeline/'+t.id,text:t.description})),
  ...content.faqs.map(f=>({title:f.question,url:'/#questions',text:f.answer})),
 ];
 const words=q.split(/\s+/);return entries.filter(e=>words.every(word=>(e.title+' '+plainText(e.text)).toLocaleLowerCase().includes(word))).slice(0,30).map(e=>({...e,text:plainText(e.text).slice(0,220)}));
}
