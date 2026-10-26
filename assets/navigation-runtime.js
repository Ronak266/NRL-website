// Local navigation and media inspection use native dialogs and stay fully offline.
const missionIndex=document.querySelector('#site-index'),openIndex=document.querySelector('#open-index'),indexSearch=document.querySelector('#index-search');
const indexLinks=[...missionIndex.querySelectorAll('.index-links a')];
function filterIndex(){
 const words=indexSearch.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
 let matches=0;
 for(const link of indexLinks){
  const haystack=(link.dataset.indexTerms+' '+link.textContent).toLowerCase();
  link.hidden=!words.every(word=>haystack.includes(word));
  if(!link.hidden)matches++;
 }
 document.querySelector('#index-empty').hidden=matches>0;
}
function showIndex(){
 indexSearch.value='';filterIndex();missionIndex.showModal();
 openIndex.setAttribute('aria-expanded','true');indexSearch.focus();
}
openIndex.addEventListener('click',showIndex);
indexSearch.addEventListener('input',filterIndex);
indexSearch.addEventListener('keydown',event=>{
 if(event.key==='Enter'){event.preventDefault();indexLinks.find(link=>!link.hidden)?.click();}
});
document.querySelector('#close-index').addEventListener('click',()=>missionIndex.close());
missionIndex.addEventListener('close',()=>openIndex.setAttribute('aria-expanded','false'));
for(const link of indexLinks)link.addEventListener('click',event=>{
 event.preventDefault();const target=document.querySelector(link.getAttribute('href'));
 missionIndex.close();
 target.scrollIntoView({behavior:cinematicReduced.matches||document.body.classList.contains('paused')?'auto':'smooth',block:'start'});
 target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
 target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});
});
document.addEventListener('keydown',event=>{
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&!event.target.closest('#drive-stage,.drive-pad')){
  event.preventDefault();if(missionIndex.open)missionIndex.close();else if(!document.querySelector('dialog[open]'))showIndex();
 }
});
const headerMotion=document.querySelector('#header-motion');
headerMotion.addEventListener('click',()=>document.querySelector('#motion').click());
function syncMotionControl(){
 const paused=document.body.classList.contains('paused');
 headerMotion.setAttribute('aria-pressed',String(paused));
 headerMotion.setAttribute('aria-label',paused?'Resume motion':'Pause motion');
 headerMotion.title=paused?'Resume motion':'Pause motion';
 if(paused){document.querySelectorAll('.card').forEach(card=>card.style.transform='');document.querySelectorAll('.actions .btn,.end .btn').forEach(button=>button.style.translate='');document.querySelector('.hero-reticle')?.classList.remove('is-visible');}
 headerMotion.textContent=paused?'▷':'Ⅱ';
}
new MutationObserver(syncMotionControl).observe(document.body,{attributes:true,attributeFilter:['class']});syncMotionControl();
const mediaViewer=document.querySelector('#media-viewer'),mediaImage=document.querySelector('#media-image');
for(const panel of document.querySelectorAll('[data-media]'))panel.addEventListener('click',()=>{
 const image=panel.querySelector('img');mediaImage.src=image.currentSrc||image.src;mediaImage.alt=image.alt;
 document.querySelector('#media-caption').textContent=panel.dataset.caption;
 mediaViewer.showModal();
});
document.querySelector('#close-media').addEventListener('click',()=>mediaViewer.close());
mediaViewer.addEventListener('close',()=>mediaImage.removeAttribute('src'));
for(const dialog of [missionIndex,mediaViewer])dialog.addEventListener('click',event=>{
 if(event.target!==dialog)return;
 const r=dialog.getBoundingClientRect();
 if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
});

const ambientObserver=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.dataset.ambientActive=String(entry.isIntersecting);},{rootMargin:'60px'});
document.querySelectorAll('.module-section,.arena-section,.sim-section').forEach(section=>ambientObserver.observe(section));
