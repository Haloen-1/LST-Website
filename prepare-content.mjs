import fs from 'node:fs';
import {parseHTML} from 'linkedom';
const fields=[]; const defaults={text:{},links:{},photos:{},contact:{email:'littlescientiststaipei@gmail.com'}};
const parsed={};
function doc(file){return parsed[file]??=(parseHTML(fs.readFileSync('public/'+file,'utf8')).document);}
function add(file,selector,key,label,group,kind='text'){
 const el=doc(file).querySelector(selector);if(!el)throw Error('Missing '+selector);
 const clone=el.cloneNode(true);clone.querySelectorAll('[aria-hidden],.sr-only').forEach(n=>n.remove());clone.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));
 defaults.text[key]=clone.textContent.trim();fields.push({key,label,group,kind,max:kind==='heading'?220:kind==='long'?4000:600});
 el.setAttribute('data-content',key);if(kind==='heading')el.setAttribute('data-heading','true');
}
const home='index.html';
const groups=[
 ['Homepage',[['.hero-copy .eyebrow','heroEyebrow','Opening label'],['.hero h1','heroTitle','Main headline','heading'],['.hero-description','heroDescription','Introduction','long'],['.hero .button','heroButton','Main button label'],['.hero-scroll','heroScroll','Scroll hint'],['.hero-image figcaption span:first-child','heroCaption','Photo caption'],['.hero-image figcaption span:last-child','heroLocation','Photo location']]],
 ['The Experience',[['#experience .section-label span:first-child','experienceLabel','Section label'],['#experience h2','experienceTitle','Headline','heading'],['#experience .large-copy','experienceDescription','Introduction','long'],['.discovery-copy>.eyebrow','discoveryLabel','Photo section label'],['.discovery-copy h2','discoveryTitle','Headline','heading']]],
 ['Our Programs',[['#programs .section-label','programsLabel','Section label'],['#programs h2','programsTitle','Headline','heading'],['#programs .section-heading>p','programsIntro','Introduction','long']]],
 ['Our Story',[['#story .section-label','storyLabel','Section label'],['#story h2','storyTitle','Headline','heading'],['.story-copy>p:nth-of-type(2)','storyParagraph1','First paragraph','long'],['.story-copy>p:nth-of-type(3)','storyParagraph2','Second paragraph','long'],['.story-copy .text-link','storyButton','Contact button label'],['.community-photo figcaption','storyCaption','Photo caption']]],
 ['FAQs',[['.faq-intro .section-label','faqLabel','Section label'],['.faq-intro h2','faqTitle','Headline','heading'],['.faq-intro .text-link','faqContact','Contact button label']]],
 ['Join & Footer',[['.join-copy .section-label','joinLabel','Section label'],['.join-copy h2','joinTitle','Headline','heading'],['.join-copy>p:not(.section-label):not(.join-note)','joinIntro','Introduction','long'],['.join-actions .button','joinButton','Workshop button label'],['.join-actions .light-link','joinContact','Contact button label'],['.join-note','joinNote','Registration note'],['.footer-top>div:first-child>p','footerTagline','Footer tagline']]],
 ['Community Event',[['.field-heading .section-label','eventLabel','Section label'],['.field-heading h2','eventTitle','Headline','heading'],['.field-link .eyebrow','eventDate','Event date label'],['.field-link h3','eventName','Event name'],['.field-link p','eventSummary','Summary','long']]]
];
for(const [group,defs]of groups)for(const [selector,key,label,kind]of defs)add(home,selector,key,label,group,kind);
for(let i=1;i<=3;i++){
 add(home,`.intro-strip span:nth-child(${i})`,'intro'+i,'Quick fact '+i,'Homepage');
 add(home,`.learning-point:nth-of-type(${i}) h3`,'learningTitle'+i,'Learning point '+i,'The Experience');
 add(home,`.learning-point:nth-of-type(${i}) p`,'learningBody'+i,'Description '+i,'The Experience','long');
}
for(let i=1;i<=2;i++){
 const prefix=`.program-row:nth-of-type(${i+1})`;
 for(const [selector,key,label,kind]of [['.program-name .eyebrow','Label','Audience'],['h3','Title','Program title','heading'],['.program-info>p','Description','Description','long'],['.text-link','Button','Button label']])add(home,prefix+' '+selector,'program'+i+key,`${i===1?'Families':'Schools'}: ${label}`,'Our Programs',kind);
 const tags=doc(home).querySelectorAll(prefix+' .tags li');tags.forEach((el,j)=>{const key=`program${i}Tag${j+1}`;el.setAttribute('data-content',key);defaults.text[key]=el.textContent;fields.push({key,label:`${i===1?'Families':'Schools'}: detail ${j+1}`,group:'Our Programs',kind:'text',max:100});});
}
for(let i=1;i<=5;i++){
 add(home,`.faq-list details:nth-child(${i}) summary`,'faqQuestion'+i,'Question '+i,'FAQs');
 add(home,`.faq-list details:nth-child(${i}) .faq-answer`,'faqAnswer'+i,'Answer '+i,'FAQs','long');
}
defaults.text.faqAnswer2='Sessions are conducted in English, with high school mentors guiding the activities. If you’re unsure whether a session is right for your child’s English level, contact us before registering.';
defaults.text.faqAnswer4='Visit our workshop page for current registration details. If no sessions are listed, contact the team to ask about upcoming opportunities. The venue and any fee are specific to each event.';
defaults.text.faqAnswer5='Yes. School and organization sessions typically run for 1–1.5 hours and combine an explanation, an experiment, and a hands-on activity. We provide the materials, and an ordinary classroom is suitable. Get in touch to discuss your group.';
const links=[
 ['navExperience','The Experience navigation','#experience'],['navPrograms','Our Programs navigation','#programs'],['navStory','Our Story navigation','#story'],['navFaq','FAQ navigation','#questions'],['heroAction','Main homepage button','#programs'],['workshops','Workshop page','/workshops'],['registration','Registration form (Google Forms, SurveyMonkey, Wix…)','https://littlescientists.wixsite.com/taipei/register'],['facebook','Facebook page','https://www.facebook.com/profile.php?id=61587177894554'],['event','Featured community event','/science-camp.html']
];
links.forEach(([key,label,value])=>{defaults.links[key]=value;fields.push({key,label,group:'Links & Contact',kind:'link',max:2000});});
function setLink(el,key){el.setAttribute('data-link',key);el.setAttribute('href',defaults.links[key]);}
for(const [selector,key]of [['a[href="#experience"]','navExperience'],['a[href="#programs"]','navPrograms'],['a[href="#story"]','navStory'],['a[href="#questions"]','navFaq'],['a[href="#join"]','workshops'],['.hero .button','heroAction'],['.field-link','event']])doc(home).querySelectorAll(selector).forEach(el=>setLink(el,key));
doc(home).querySelectorAll('a[href*="/register"]').forEach(el=>{setLink(el,'workshops');el.removeAttribute('target');el.removeAttribute('rel');});
defaults.text.joinButton='Find your next workshop';defaults.text.joinNote='Find the details and register on our workshop page.';
const ws='workshops.html';
for(const [selector,key,label,kind]of [['.eyebrow','workshopLabel','Opening label'],['h1','workshopTitle','Headline','heading'],['.lede','workshopIntro','Introduction','long'],['.workshop-registration h2','registrationTitle','Registration heading'],['.workshop-registration>p:not(.registration-note)','registrationDescription','Registration instructions','long'],['.registration-action','registrationButton','Registration button label'],['.registration-note','registrationNote','Registration note'],['.workshop-contact','workshopContact','Contact button label'],['figcaption','workshopCaption','Photo caption']])add(ws,selector,key,label,'Workshop Page',kind);
setLink(doc(ws).querySelector('.registration-action'),'registration');
for(const file of ['index.html','workshops.html','science-camp.html','privacy.html','404.html']){
 const d=doc(file);
 d.querySelectorAll('a[href^="mailto:"]').forEach(el=>{const u=new URL(el.getAttribute('href'));el.setAttribute('data-contact','true');el.setAttribute('data-subject',u.searchParams.get('subject')??'Hello Little Scientists Taipei');el.setAttribute('target','_blank');el.setAttribute('rel','noopener');el.setAttribute('href','https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(defaults.contact.email)+'&su='+encodeURIComponent(u.searchParams.get('subject')??'Hello Little Scientists Taipei'));if(el.textContent.trim()===defaults.contact.email)el.setAttribute('data-email','true');});
 d.querySelectorAll('a[href*="facebook.com"]').forEach(el=>setLink(el,'facebook'));
 if(file!=='index.html')d.querySelectorAll('a[href="/#join"]').forEach(el=>setLink(el,'workshops'));
 for(const [slot,src,alt,x,y]of [['hero','/assets/experiment.jpg','Children and a mentor exploring science together',62,50],['discovery','/assets/discovery.jpg','Young explorers working together with science mentors',50,50],['community','/assets/community.jpg','A Little Scientists Taipei workshop',50,50]]){
  defaults.photos[slot]??={src,alt,x,y};d.querySelectorAll(`img[src="${src}"]`).forEach(el=>el.setAttribute('data-photo',slot));
 }
 if(['index.html','workshops.html','science-camp.html'].includes(file)){
  const group=file===home?'Homepage':file===ws?'Workshop Page':'Community Event';
  const key=file===home?'home':file===ws?'workshop':'camp';
  add(file,'title',key+'SeoTitle','Browser/search title',group);
  const meta=d.querySelector('meta[name="description"]');meta.setAttribute('data-meta',key+'SeoDescription');defaults.text[key+'SeoDescription']=meta.getAttribute('content');fields.push({key:key+'SeoDescription',label:'Search description',group,kind:'text',max:400});
 }
 fs.writeFileSync('public/'+file,d.toString());
}
fs.writeFileSync('src/content-schema.json',JSON.stringify(fields,null,2));
fs.writeFileSync('src/default-content.json',JSON.stringify(defaults,null,2));
console.log('Prepared',fields.length,'editable fields');
