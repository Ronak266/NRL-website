// Cinematic motion follows the visitor. No scroll hijacking or hidden loading screen.
const cinematicReduced=matchMedia('(prefers-reduced-motion: reduce)');
const manifesto=document.querySelector('.manifesto'),manifestoLines=[...document.querySelectorAll('.manifesto-line')],heroSection=document.querySelector('.hero');
let manifestoVisible=false,heroVisible=true,cinematicFrame=0;
new IntersectionObserver(entries=>{for(const e of entries){if(e.target===manifesto)manifestoVisible=e.isIntersecting;if(e.target===heroSection)heroVisible=e.isIntersecting;}},{rootMargin:'80px'}).observe(manifesto);
new IntersectionObserver(entries=>heroVisible=entries[0].isIntersecting,{rootMargin:'80px'}).observe(heroSection);
function cinema(time){requestAnimationFrame(cinema);if(time-cinematicFrame<32||document.hidden)return;cinematicFrame=time;
 const reduced=cinematicReduced.matches,paused=document.body.classList.contains('paused');
 if(manifestoVisible&&!paused){const r=manifesto.getBoundingClientRect();const p=reduced?1:clamp((innerHeight*.6-r.top)/(r.height-innerHeight*.2));manifestoLines.forEach((line,i)=>line.style.setProperty('--fill',(clamp(p*3.8-i)*100)+'%'));}
 if(heroVisible&&!paused){const p=reduced?0:clamp(-heroSection.getBoundingClientRect().top/innerHeight);heroSection.style.setProperty('--hero-scroll',p.toFixed(3));heroSection.querySelector('.hero-copy').style.transform='translateY('+(-p*45)+'px)';heroSection.querySelector('.hero-stamp').style.transform='translateY('+(p*95)+'px) rotate(-10deg)';}
}
requestAnimationFrame(cinema);
// Progressive text entrance adds hierarchy to section transitions.
for(const heading of document.querySelectorAll('.section-head h2,.mission h2')){
 heading.style.transition='transform 1.1s cubic-bezier(.16,1,.3,1),opacity 1.1s';
 const io=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){if(!cinematicReduced.matches&&!document.body.classList.contains('paused'))heading.animate([{transform:'translateY(35px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:1000,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});io.disconnect();}},{threshold:.15});io.observe(heading);
}
// Small magnetic response gives buttons weight without moving their hit target.
if(matchMedia('(pointer:fine)').matches){for(const button of document.querySelectorAll('.actions .btn,.end .btn')){
 button.addEventListener('pointermove',e=>{if(cinematicReduced.matches||document.body.classList.contains('paused'))return;const r=button.getBoundingClientRect();button.style.translate=((e.clientX-r.left-r.width/2)*.09)+'px '+((e.clientY-r.top-r.height/2)*.12)+'px';});button.addEventListener('pointerleave',()=>button.style.translate='0 0');
}}
cinematicReduced.addEventListener('change',()=>{if(cinematicReduced.matches){manifestoLines.forEach(line=>line.style.setProperty('--fill','100%'));heroSection.querySelector('.hero-copy').style.transform='none';document.getAnimations().forEach(a=>{if(Number.isFinite(a.effect?.getComputedTiming().endTime))a.finish();else a.cancel();});}});
new MutationObserver(()=>{
 const paused=document.body.classList.contains('paused');
 for(const animation of document.getAnimations())if(animation.effect?.target?.matches('.section-head h2,.mission h2')){
  if(paused&&animation.playState==='running')animation.pause();else if(!paused&&animation.playState==='paused')animation.play();
 }
}).observe(document.body,{attributes:true,attributeFilter:['class']});

// A deliberate power switch: gradual light and orbital acceleration, never strobing.
const ignitionButton=document.querySelector('#hero-ignite');
ignitionButton.addEventListener('click',()=>{
 const active=ignitionButton.getAttribute('aria-pressed')!=='true';
 ignitionButton.setAttribute('aria-pressed',String(active));
 ignitionButton.textContent=active?'FORGE IGNITED · POWER DOWN':'IGNITE THE FORGE ↗';
 heroSection.classList.toggle('energy-active',active);
 heroSection.querySelector('.hero-art').dataset.ignition=active?'1':'0';
});

// Expanded pilot view also works in browsers without the Fullscreen API.
const arenaShell=document.querySelector('.arena-shell'),expandButton=document.querySelector('#arena-expand');
let expanding=false;
function syncArenaExpansion(){
 const active=document.fullscreenElement===arenaShell||arenaShell.classList.contains('expanded');
 expandButton.setAttribute('aria-pressed',String(active));
 expandButton.textContent=active?'EXIT ARENA ↙':'EXPAND ARENA ⛶';
 document.body.classList.toggle('arena-expanded',active);
}
expandButton.addEventListener('click',async()=>{
 if(expanding)return;expanding=true;
 try{
  if(document.fullscreenElement===arenaShell)await document.exitFullscreen();
  else if(arenaShell.classList.contains('expanded'))arenaShell.classList.remove('expanded');
  else{
   try{if(!arenaShell.requestFullscreen)throw new Error('Fullscreen unavailable');await arenaShell.requestFullscreen();}
   catch{arenaShell.classList.add('expanded');}
  }
 }finally{expanding=false;syncArenaExpansion();document.querySelector('#drive-stage').focus({preventScroll:true});}
});
document.addEventListener('fullscreenchange',syncArenaExpansion);
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&arenaShell.classList.contains('expanded')){
  arenaShell.classList.remove('expanded');syncArenaExpansion();expandButton.focus({preventScroll:true});
 }
});

// A compact chapter spine gives the long cinematic page a sense of place.
const chapterLinks=[...document.querySelectorAll('.scene-rail a')];
const chapters=chapterLinks.map(link=>({link,section:document.getElementById(link.dataset.scene)}));
const chapterCue=document.createElement('div');chapterCue.className='chapter-cue mono';chapterCue.setAttribute('aria-hidden','true');
chapterCue.innerHTML='<b></b><span></span>';document.body.append(chapterCue);
let chapterFrame=0,currentScene=null,cueTimer=0;
function updateChapter(){
 if(chapterFrame)return;
 chapterFrame=requestAnimationFrame(()=>{
  chapterFrame=0;
  const marker=innerHeight*.43;
  let current=chapters[0];
  for(const chapter of chapters)if(chapter.section.getBoundingClientRect().top<=marker)current=chapter;
  for(const chapter of chapters){
   if(chapter===current)chapter.link.setAttribute('aria-current','location');
   else chapter.link.removeAttribute('aria-current');
  }
  if(current!==currentScene){
   if(currentScene&&!cinematicReduced.matches&&!document.body.classList.contains('paused')){
    chapterCue.querySelector('b').textContent=current.link.querySelector('b').textContent;
    chapterCue.querySelector('span').textContent=current.link.querySelector('span').textContent;
    chapterCue.classList.remove('is-visible');
    void chapterCue.offsetWidth;
    chapterCue.classList.add('is-visible');
    clearTimeout(cueTimer);cueTimer=setTimeout(()=>chapterCue.classList.remove('is-visible'),1500);
   }
   currentScene=current;
  }
 });
}
addEventListener('scroll',updateChapter,{passive:true});
addEventListener('resize',updateChapter,{passive:true});
updateChapter();

// Scroll choreography: reveal each new scene once, then let visitors use it normally.
const entranceObserver=new IntersectionObserver(entries=>{
 for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-inview');entranceObserver.unobserve(entry.target);}
},{threshold:.08,rootMargin:'0px 0px 50px 0px'});
function watchEntrance(element,index=0){
 if(!element||element.classList.contains('scroll-entrance'))return;
 element.style.setProperty('--entrance-delay',Math.min(index,5)*95+'ms');
 element.classList.add('scroll-entrance');
 entranceObserver.observe(element);
}
for(const selector of ['.sim-screen','.mentor-grid .portrait','.mentor-grid>div:last-child'])
 document.querySelectorAll(selector).forEach(watchEntrance);
for(const selector of ['.sim-chapter','.gallery-tile','.mission-values>div','.module-tile'])
 document.querySelectorAll(selector).forEach((element,index)=>watchEntrance(element,index));
const cardContainer=document.querySelector('#cards');
function watchCards(){[...cardContainer.children].forEach((element,index)=>watchEntrance(element,index));}
watchCards();
new MutationObserver(watchCards).observe(cardContainer,{childList:true});

// Red ink travels down each scene as it crosses the viewing area.
const inkScenes=[...document.querySelectorAll('#modules,#arena,#simulations,#team,#journey,#gallery')];
for(const scene of inkScenes){const ink=document.createElement('i');ink.className='scene-ink';ink.setAttribute('aria-hidden','true');scene.append(ink);}
const sceneVisibility=new IntersectionObserver(entries=>{
 for(const entry of entries)entry.target.dataset.scrollVisible=entry.isIntersecting?'true':'false';
},{rootMargin:'100px'});
inkScenes.forEach(scene=>sceneVisibility.observe(scene));
let sceneFrame=0;
function updateSceneInk(){
 if(sceneFrame)return;
 sceneFrame=requestAnimationFrame(()=>{
  sceneFrame=0;
  if(cinematicReduced.matches||document.body.classList.contains('paused'))return;
  for(const scene of inkScenes)if(scene.dataset.scrollVisible==='true'){
   const rect=scene.getBoundingClientRect();
   const progress=clamp((innerHeight*.78-rect.top)/(rect.height+innerHeight*.1));
   scene.style.setProperty('--scene-progress',progress.toFixed(3));
  }
 });
}
addEventListener('scroll',updateSceneInk,{passive:true});
addEventListener('resize',updateSceneInk,{passive:true});
updateSceneInk();

// Pointer lighting follows the surface, leaving text and hit targets still.
if(matchMedia('(pointer:fine)').matches){
 for(const surface of document.querySelectorAll('.card,.gallery-tile,.sim-screen,.module-tile')){
  surface.classList.add('light-surface');
  surface.addEventListener('pointermove',event=>{
   if(cinematicReduced.matches||document.body.classList.contains('paused'))return;
   const rect=surface.getBoundingClientRect();
   surface.style.setProperty('--light-x',event.clientX-rect.left+'px');
   surface.style.setProperty('--light-y',event.clientY-rect.top+'px');
  });
 }
}

// Module panels are real shortcuts into the matching subassembly.
for(const tile of document.querySelectorAll('.module-tile'))tile.addEventListener('click',()=>{
 const tab=document.querySelector('.system-tabs button[data-system="'+tile.dataset.systemJump+'"]');
 tab.click();
 document.querySelector('#assembly').scrollIntoView({behavior:cinematicReduced.matches||document.body.classList.contains('paused')?'auto':'smooth',block:'start'});
 tab.focus({preventScroll:true});
});

// The reticle tracks an intentional robot interaction without changing its drag controls.
if(matchMedia('(pointer:fine)').matches){
 const art=document.querySelector('.hero-art'),reticle=art.querySelector('.hero-reticle');
 let reticleFrame=0,pointerX=0,pointerY=0;
 art.addEventListener('pointermove',event=>{
  if(cinematicReduced.matches||document.body.classList.contains('paused'))return;
  const r=art.getBoundingClientRect();pointerX=event.clientX-r.left;pointerY=event.clientY-r.top;
  if(reticleFrame)return;
  reticleFrame=requestAnimationFrame(()=>{
   reticleFrame=0;reticle.style.translate=pointerX+'px '+pointerY+'px';
   reticle.classList.add('is-visible');
  });
 });
 art.addEventListener('pointerleave',()=>reticle.classList.remove('is-visible','is-dragging'));
 art.addEventListener('pointerdown',event=>{
  if(event.target.closest('button'))return;
  reticle.classList.add('is-dragging');reticle.querySelector('span').textContent='ROTATING 187';
 });
 for(const name of ['pointerup','pointercancel'])art.addEventListener(name,()=>{
  reticle.classList.remove('is-dragging');reticle.querySelector('span').textContent='DRAG TO ORBIT';
 });
}

// Team stats count only when visitors reach the mission, then keep their final value.
const stats=[...document.querySelectorAll('.mission-values b')].filter(element=>/^\d+$/.test(element.textContent.trim()));
const statObserver=new IntersectionObserver(entries=>{
 if(!entries[0].isIntersecting)return;
 statObserver.disconnect();
 if(cinematicReduced.matches||document.body.classList.contains('paused'))return;
 const start=performance.now();
 function count(now){
  const fraction=Math.min(1,(now-start)/1100),eased=1-Math.pow(1-fraction,3);
  for(const element of stats){
   const final=Number(element.dataset.finalCount);
   element.textContent=String(Math.round(final*eased)).padStart(element.dataset.finalCount.length,'0');
  }
  if(fraction<1&&!document.body.classList.contains('paused'))requestAnimationFrame(count);
  else for(const element of stats)element.textContent=element.dataset.finalCount;
 }
 requestAnimationFrame(count);
},{threshold:.45});
for(const element of stats)element.dataset.finalCount=element.textContent.trim();
statObserver.observe(document.querySelector('.mission-values'));
