// Small, deliberately limited formatter shared by the editor and the server.
export const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function richText(value){
 let text=escapeText(value);const links=[];
 text=text.replace(/\[([^\]\n]+)\]\((https:\/\/[^\s<>]+|\/(?!\/)[^\s<>]*)\)/g,(all,label,href)=>{try{const decoded=href.replaceAll('&amp;','&');const u=new URL(decoded,'https://local.invalid');if(u.username||u.password||/[\\]/.test(decoded))return all;const token='\u0001'+links.length+'\u0001';links.push(`<a href="${href}"${decoded.startsWith('https:')?' target="_blank" rel="noopener"':''}>${label}</a>`);return token;}catch{return all;}});
 text=text.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<u>$1</u>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
 text=text.split('\n').map(line=>line.startsWith('- ')?'<span class="rich-list-item">• '+line.slice(2)+'</span>':/^\d+\. /.test(line)?'<span class="rich-list-item">'+line+'</span>':line).join('<br>');
 return text.replace(/\u0001(\d+)\u0001/g,(_,index)=>links[Number(index)]??'');
}
export function plainText(value){return String(value??'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\*\*|__|\*/g,'');}
