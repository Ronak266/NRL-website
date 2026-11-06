/* TitanForge coordinated build. Native Web Animations + IntersectionObserver.
 * One clock drives all reveals, cursor paths, selection drags and guided scrolling.
 * Content is visible by default. The overlay is inert and never owns input. */
(()=>{
 'use strict';
 const one=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 const overlay=one('#forge-overlay'),dock=one('.forge-dock');
 if(!overlay||!dock){document.documentElement.classList.remove('forge-start');return;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:760px)');
 const status=one('#forge-status'),pauseButton=one('#forge-pause'),progressBar=one('#forge-progress');
 const chapterNames=['ARRIVAL','MEET THE FORGE','SIX MINDS. ONE SQUAD.','OUR MENTOR','THE MACHINE','HYPERDRIVE','FOLLOW THE FORGE'];
 const nodes=[],registered=new WeakMap(),queue=[],lanes=[];
 let guide=null,opening=false,userPaused=false,frame=0,lastTime=0,quiet=null,inhibitUntil=0;
 let scanTimer=0,initializing=true;
 const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
 const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 const mix=(a,b,p)=>a+(b-a)*p;
 function topOf(el){let y=0;for(let e=el;e;e=e.offsetParent)y+=e.offsetTop;return y;}
 function visible(node){if(node.el.tagName==='HEADER')return true;const r=node.el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>90&&r.top<innerHeight-95;}
 function setStatus(text){if(status.textContent!==text)status.textContent=text;}
 function updateControls(){
  const watching=Boolean(guide);
  document.body.classList.toggle('forge-showcase',watching);
  document.body.dataset.forgeMode=watching?(userPaused?'paused':'showcase'):'explore';
  all('.forge-dock [data-forge-watch]').forEach(b=>b.hidden=watching);
  pauseButton.hidden=!watching;
  pauseButton.textContent=userPaused?'Resume ▷':'Pause Ⅱ';
  pauseButton.setAttribute('aria-pressed',String(userPaused));
 }
 function makeLanes(){
  overlay.replaceChildren();lanes.length=0;
  const agents=[['#ff6076','Layout'],['#63d6e7','Media'],['#dabd73','Copy']];
  agents.slice(0,mobile.matches?2:3).forEach(([color,name],i)=>{
   const pointer=document.createElement('div');pointer.className='forge-agent';pointer.style.setProperty('--agent',color);
   pointer.innerHTML='<svg viewBox="0 0 17 23" fill="none"><path d="M1 1L15 14L8.7 14.8L5 21L1 1Z" fill="'+color+'" stroke="#09090b" stroke-width="1.3" stroke-linejoin="round"/></svg><span>'+name+'</span>';
   const box=document.createElement('div');box.className='forge-selection';box.style.setProperty('--agent',color);box.innerHTML='<span class="forge-selection-label"></span>';
   overlay.append(pointer,box);lanes.push({pointer,box,name,x:innerWidth*.46+i*30,y:innerHeight*.43+i*12,job:null});
  });
 }
 function register(el,chapter,label,kind='text',pieceSelector=''){
  if(!el||registered.has(el))return;
  const pieces=pieceSelector?[...el.querySelectorAll(pieceSelector)]:[];
  const node={el,chapter,label,kind,pieces,built:false,queued:false};
  el.classList.add('forge-node');el.dataset.forgeChapter=String(chapter+1);registered.set(el,node);nodes.push(node);
  observer.observe(el);return node;
 }
 function select(selector,chapter,label,kind='text',pieces=''){
  all(selector).forEach((el,i)=>register(el,chapter,label+(all(selector).length>1?' / '+String(i+1).padStart(2,'0'):''),kind,pieces));
 }
 const observer=new IntersectionObserver(entries=>{
  if(initializing||guide||opening||reduced.matches||document.body.classList.contains('paused')||performance.now()<inhibitUntil)return;
  for(const e of entries)if(e.isIntersecting){const node=registered.get(e.target);if(node)enqueue(node);}
  wake();
 },{threshold:.08,rootMargin:'-82px 0px -75px 0px'});
 function roster(){
  select('#cards .card',2,'BUILD PROFILE','frame','.portrait img,.portrait .mono,.member-role,h3,.card-foot');
 }
 select('header',0,'NAVIGATION','frame','.brand,.desktop-nav,.header-tools');
 select('.school-team-logos',0,'TEAM IDENTITY','frame','img,.school-campus');
 select('.hero .eyebrow',0,'TEAM 187');select('.hero h1',0,'TITANFORGE');
 select('.hero .intro',0,'OUR MISSION');select('.hero-school',0,'SILVER OAKS / HYDERABAD');
 select('.hero .actions',0,'CHOOSE YOUR EXPERIENCE','frame','.btn');
 select('.hero-art',0,'PROTOTYPE VIEWER','frame','canvas,.hero-robot,.art-label,.machine-serial,.robot-callout,.hero-view-controls');
 select('.event-brand',0,'COMPETITION IDENTITY','frame','img,.mono,.event-presenter');
 select('.hero-bottom',0,'SYSTEM 187');
 select('#team-introduction .section-head h2',1,'MEET THE FORGE');select('#team-introduction .section-head p',1,'OUR INTRODUCTION');
 select('.intro-video-card',1,'INTRODUCTION FRAME','frame','video,.intro-video-label');
 select('#team-introduction>.wrap>.btn',1,'TEAM DIRECTORY','frame');
 select('#team .section-head h2',2,'SIX MINDS. ONE SQUAD.');select('#team .section-head p',2,'THE PEOPLE');
 select('.dir-side,.dir-bar',2,'PERSONNEL INDEX','frame');roster();
 select('#mentor .portrait',3,'MENTOR PORTRAIT','frame','img');
 select('#mentor .mono,#mentor h3,#mentor .mentor-position,#mentor .mentor-school',3,'OUR MENTOR');
 select('#mentor .mentor-intro',3,'NEELIMA VALIVETI / INTRODUCTION');
 select('.manifesto small,.manifesto-line,.manifesto p',4,'HOW WE BUILD');
 select('.lab-heading',4,'THE MACHINE','frame','h2,p,.mono,.part-total');
 select('.system-tabs,.mechanism-tools,.camera-panel',4,'SYSTEM CONTROLS','frame');
 select('#lab-stage',4,'ENGINEERING EXPLORER','frame','canvas,img,.stage-title,.stage-corner,.component-info,.scene-caption');
 select('.explorer-console,.breakdown-stages,.model-note',4,'MECHANICAL BREAKDOWN','frame');
 select('.module-intro h2,.module-intro p',4,'FOUR SYSTEMS');
 select('.module-tile',4,'SYSTEM DOSSIER','frame','.module-art,.module-copy');
 select('#simulations .section-head h2,#simulations .section-head p',4,'MOTION STUDY');
 select('.sim-screen',4,'SIMULATION THEATRE','frame','.sim-toolbar,.video-frame,#playback-status');
 select('.sim-chapter',4,'MOTION CHAPTER','frame','h3,p,.mono');
 select('.mission h2,.mission-grid>div:last-child',4,'FORGED IN CURIOSITY');
 select('#gallery .section-head h2,#gallery .section-head p',4,'PROTOTYPE FILES');
 select('.gallery-tile',4,'REAL BUILD / DIGITAL BUILD','frame','img,div,.gallery-open');
 select('#arena .section-head h2,#arena .section-head p',5,'HYPERDRIVE');
 select('#hyperdrive-rules>summary',5,'HYPERDRIVE PLAYBOOK','frame');
 select('.rules-intro',5,'OFFICIAL RULES','frame','h3,p,a');
 select('.rules-grid article',5,'RULES PANEL','frame','.mono,h4,p');
 select('.score-table-wrap,.training-limits',5,'SCORING + CONDITIONS','frame');
 select('.arena-topbar',5,'MATCH SYSTEMS','frame');
 select('#drive-stage',5,'PLAYABLE ARENA','frame','canvas,.match-scoreboard,.arena-hud,.field-note');
 select('.match-actions,.match-intel,.star-map-row,.arena-console,.drive-footer',5,'PLAYER CONTROLS','frame');
 select('#follow h2',6,'FOLLOW THE FORGE');select('#follow .mono',6,'THE NEXT CHAPTER');select('#follow .btn',6,'JOIN TEAM 187','frame');
 new MutationObserver(roster).observe(one('#cards'),{childList:true});
 function enqueue(node,force=false){
  if(node.built||node.queued||!visible(node)||(!force&&(quiet||reduced.matches||performance.now()<inhibitUntil)))return;
  node.queued=true;queue.push(node);
 }
 function revealAnimation(el,start,duration,kind){
  const keyframes=kind==='text'?
   [{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:1,offset:.15,clipPath:'inset(0 90% 0 0)'},{opacity:1,clipPath:'inset(0 0% 0 0)'}]:
   [{opacity:0,clipPath:'inset(0 0 100% 0)'},{opacity:1,clipPath:'inset(0 0 0% 0)'}];
  const animation=el.animate(keyframes,{duration,delay:start,fill:'both',easing:kind==='text'?'steps(8,end)':'cubic-bezier(.16,1,.3,1)'});
  animation.pause();animation.currentTime=0;return animation;
 }
 function startJob(lane,node){
  const speed=guide||opening?1:.72;
  // Pause and seek real-element animations from the shared clock. No text replacement.
  const animations=[revealAnimation(node.el,480*speed,530*speed,node.kind)];
  node.pieces.forEach((el,i)=>animations.push(revealAnimation(el,(610+Math.min(i,7)*75)*speed,420*speed,el.matches('h1,h2,h3,p,.member-role')?'text':'frame')));
  lane.job={node,fromX:lane.x,fromY:lane.y,animations,time:0,speed,end:Math.max(1720,1120+Math.min(node.pieces.length,8)*75)*speed};
  node.el.classList.remove('forge-pending');
  lane.box.querySelector('span').textContent=node.label;
  lane.pointer.querySelector('span').textContent=lane.name+' · '+(node.kind==='text'?'writing':'framing');
 }
 function complete(lane){
  const job=lane.job;if(!job)return;
  job.animations.forEach(animation=>animation.cancel());
  job.node.el.classList.remove('forge-pending');job.node.el.dataset.forgeBuilt='true';job.node.built=true;job.node.queued=false;
  lane.pointer.style.opacity='0';lane.box.style.opacity='0';lane.job=null;
 }
 function clearJobs(){
  queue.splice(0).forEach(node=>{node.queued=false;node.el.classList.remove('forge-pending');});lanes.forEach(complete);
  all('.forge-pending').forEach(el=>el.classList.remove('forge-pending'));
 }
 function cursorFrame(lane,dt){
  if(!lane.job)return;
  const job=lane.job;job.time+=dt;
  if(!visible(job.node)){complete(lane);return;}
  const t=job.time/job.speed,r=job.node.el.getBoundingClientRect();
  const left=clamp(r.left-4,3,innerWidth-20),top=clamp(r.top-4,job.node.el.tagName==='HEADER'?3:83,innerHeight-90);
  const right=clamp(r.right+4,left+4,innerWidth-3),bottom=clamp(r.bottom+4,top+4,innerHeight-85);
  const arrival=ease(clamp(t/360)),drag=ease(clamp((t-490)/450));
  lane.x=t<490?mix(job.fromX,left,arrival):mix(left,right,drag);
  lane.y=t<490?mix(job.fromY,top,arrival):mix(top,bottom,drag);
  const fade=clamp((t-140)/120)*clamp((job.end/job.speed-t)/160);
  lane.pointer.style.opacity=String(fade);lane.pointer.style.transform='translate3d('+lane.x+'px,'+lane.y+'px,0)';
  lane.box.style.width=(right-left)+'px';lane.box.style.height=(bottom-top)+'px';
  lane.box.style.transform='translate3d('+left+'px,'+top+'px,0) scale('+Math.max(.003,drag)+','+Math.max(.003,drag)+')';
  // Labels are legible once the selection reaches its final dimensions.
  lane.box.querySelector('span').style.opacity=String(clamp((drag-.8)*5));
  lane.box.style.opacity=String(t>=490?fade:0);
  for(const animation of job.animations)animation.currentTime=job.time;
  if(job.time>=job.end)complete(lane);
 }
 function quietActive(){
  if(!quiet)return false;
  const r=quiet.getBoundingClientRect();
  if(r.bottom<=70||r.top>=innerHeight){quiet=null;document.body.classList.remove('forge-playing');return false;}
  return true;
 }
 function scan(){if(guide||opening||quietActive()||reduced.matches||performance.now()<inhibitUntil)return;for(const node of nodes)enqueue(node);wake();}
 function positionStops(){
  const available=innerHeight-205,stops=[];
  for(let chapter=0;chapter<7;chapter++){
   const group=nodes.filter(n=>n.chapter===chapter&&n.el.isConnected&&n.el.getClientRects().length).map(n=>({node:n,y:topOf(n.el),height:n.el.offsetHeight})).sort((a,b)=>a.y-b.y);
   for(const item of group){
    let stop=stops.at(-1);
    if(!stop||stop.chapter!==chapter||item.y+Math.min(item.height,available)>stop.y+available+100){
     stop={chapter,y:Math.max(0,item.y-108),nodes:[]};stops.push(stop);
    }
    stop.nodes.push(item.node);
   }
  }
  return stops;
 }
 function guideMove(stop){
  guide.phase='travel';guide.elapsed=0;guide.from=scrollY;guide.to=Math.min(stop.y,document.documentElement.scrollHeight-innerHeight);
  guide.lastScroll=scrollY;guide.duration=reduced.matches?0:clamp(Math.abs(guide.to-guide.from)*.22,550,1300);
  setStatus(String(stop.chapter+1).padStart(2,'0')+' / 07 · '+chapterNames[stop.chapter]);
 }
 function advanceGuide(dt){
  if(!guide)return;
  const stop=guide.stops[guide.index];if(!stop){stopShowcase('BUILD COMPLETE · YOUR TURN');document.body.classList.add('forge-finished');return;}
  guide.elapsed+=dt;
  progressBar.style.transform='scaleX('+clamp((guide.index+(guide.phase==='hold'?.9:.3))/guide.stops.length)+')';
  if(guide.phase==='travel'){
   const p=guide.duration?clamp(guide.elapsed/guide.duration):1;
   guide.lastScroll=mix(guide.from,guide.to,ease(p));
   window.scrollTo({top:guide.lastScroll,behavior:'instant'});
   if(p>=1){
    guide.phase='build';guide.elapsed=0;
    stop.nodes.forEach(node=>enqueue(node,true));
   }
  }else if(guide.phase==='build'){
   if(!queue.length&&lanes.every(l=>!l.job)){guide.phase='hold';guide.elapsed=0;}
  }else if(guide.elapsed>=1100){guide.index++;if(guide.index<guide.stops.length)guideMove(guide.stops[guide.index]);else{progressBar.style.transform='scaleX(1)';stopShowcase('BUILD COMPLETE · YOUR TURN');document.body.classList.add('forge-finished');}}
 }
 function tick(time){
  frame=0;const dt=lastTime?Math.min(time-lastTime,80):16;lastTime=time;
  if(!document.hidden&&!userPaused&&!document.body.classList.contains('paused')){
   if(quietActive()){clearJobs();return;}
   advanceGuide(dt);
   for(const lane of lanes){
    if(!lane.job&&queue.length){let node=queue.shift();if(visible(node))startJob(lane,node);else{node.queued=false;node.el.classList.remove('forge-pending');}}
    cursorFrame(lane,dt);
   }
   if(opening&&!queue.length&&lanes.every(l=>!l.job)){opening=false;setStatus('EXPLORE THE FORGE');scan();}
  }
  if(guide||opening||queue.length||lanes.some(l=>l.job))wake();
 }
 function wake(){if(!frame&&!userPaused&&!document.hidden&&!document.body.classList.contains('paused'))frame=requestAnimationFrame(tick);}
 function stopShowcase(message='EXPLORE THE FORGE'){
  guide=null;opening=false;userPaused=false;clearJobs();clearTimeout(scanTimer);scanTimer=0;
  if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;
  document.documentElement.classList.remove('forge-start');
  setStatus(message);updateControls();
 }
 function interrupt(){
  if(!guide&&!opening)return;
  stopShowcase();inhibitUntil=performance.now()+450;
  scanTimer=setTimeout(()=>{scanTimer=0;scan();},460);
 }
 function watch(){
  stopShowcase();quiet=null;document.body.classList.remove('forge-playing','forge-finished');
  if(reduced.matches){setStatus('REDUCED MOTION · EXPLORE FREELY');return;}
  // An explicitly requested showcase can resume decorative motion, but never start media.
  if(document.body.classList.contains('paused'))one('#motion').click();
  const start=one('#drive-start');if(start.getAttribute('aria-pressed')==='true')start.click();
  all('video').forEach(v=>v.pause());
  // A replay always includes all six people and the complete playbook.
  if(one('[data-folder=members]').getAttribute('aria-pressed')!=='true')one('[data-folder=members]').click();
  roster();one('#hyperdrive-rules').open=true;
  nodes.forEach(n=>{n.built=false;n.queued=false;delete n.el.dataset.forgeBuilt;});
  guide={stops:positionStops(),index:0,phase:'travel',elapsed:0};
  guideMove(guide.stops[0]);updateControls();wake();
 }
 all('[data-forge-watch]').forEach(button=>button.addEventListener('click',watch));
 one('#forge-replay').addEventListener('click',watch);
 one('#forge-explore').addEventListener('click',()=>{stopShowcase();scan();});
 all('[data-forge-explore]').forEach(button=>button.addEventListener('click',()=>stopShowcase()));
 pauseButton.addEventListener('click',()=>{
  if(!guide)return;userPaused=!userPaused;updateControls();
  setStatus(userPaused?'SHOWCASE PAUSED · YOUR PACE':String(guide.stops[guide.index].chapter+1).padStart(2,'0')+' / 07 · '+chapterNames[guide.stops[guide.index].chapter]);
  lastTime=0;wake();
 });
 addEventListener('wheel',interrupt,{passive:true,capture:true});
 addEventListener('touchmove',interrupt,{passive:true,capture:true});
 addEventListener('keydown',event=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End',' ','Escape','Tab'].includes(event.key))interrupt();
 },{capture:true});
 document.addEventListener('pointerdown',event=>{
  if(event.target.closest('.forge-dock,[data-forge-watch]'))return;
  interrupt();
  if(event.target.closest('.arena-shell')){quiet=one('.arena-shell');document.body.classList.add('forge-playing');clearJobs();}
  if(event.target.closest('#lab-stage,.hero-art')){quiet=event.target.closest('#lab-stage,.hero-art');clearJobs();}
 },{capture:true});
 document.addEventListener('click',event=>{
  if(event.target.closest('a[href^="#"],#open-index,[data-system-jump],[data-camera]'))interrupt();
 },{capture:true});
 document.addEventListener('focusin',event=>{
  const node=event.target.closest('.forge-node');if(!node)return;
  node.classList.remove('forge-pending');
  for(const lane of lanes)if(lane.job&&(lane.job.node.el===node||lane.job.node.el.contains(event.target)))complete(lane);
 });
 all('video').forEach(video=>video.addEventListener('play',()=>{interrupt();quiet=video;clearJobs();}));
 new MutationObserver(()=>{
  const playing=one('#drive-start').getAttribute('aria-pressed')==='true'||one('#drive-demo').getAttribute('aria-pressed')==='true';
  if(playing){interrupt();quiet=one('.arena-shell');document.body.classList.add('forge-playing');clearJobs();}
 }).observe(one('.arena-actions'),{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
 new MutationObserver(()=>{
  if(document.body.classList.contains('paused')){lanes.forEach(l=>{l.pointer.style.opacity='0';l.box.style.opacity='0';});}
  else{lastTime=0;wake();scan();}
 }).observe(document.body,{attributes:true,attributeFilter:['class']});
 all('dialog').forEach(dialog=>new MutationObserver(()=>{
  if(dialog.open){interrupt();clearJobs();}
 }).observe(dialog,{attributes:true,attributeFilter:['open']}));
 addEventListener('scroll',()=>{
  if(guide){if(Math.abs(scrollY-guide.lastScroll)>3)interrupt();else return;}
  // User scrollbars and assistive navigation are native; no scroll locking.
  for(const lane of lanes)if(lane.job&&!visible(lane.job.node))complete(lane);
  if(!frame)scan();
 },{passive:true});
 addEventListener('resize',()=>{interrupt();clearJobs();makeLanes();scan();});
 document.addEventListener('visibilitychange',()=>{lastTime=0;if(!document.hidden)wake();});
 reduced.addEventListener('change',()=>{if(reduced.matches){stopShowcase('REDUCED MOTION · EXPLORE FREELY');all('.forge-pending').forEach(el=>el.classList.remove('forge-pending'));}else scan();});
 makeLanes();initializing=false;updateControls();
 document.documentElement.classList.remove('forge-start');
 if(!reduced.matches&&!location.hash&&!document.body.classList.contains('paused')){
  opening=true;setStatus('01 / 07 · ASSEMBLING THE FORGE');
  nodes.filter(node=>node.chapter===0&&visible(node)).forEach(node=>{node.el.classList.add('forge-pending');enqueue(node,true);});
  wake();
 }else{setStatus(reduced.matches?'REDUCED MOTION · EXPLORE FREELY':'EXPLORE THE FORGE');scan();}
 // If another script fails later, content remains accessible without a completed showcase.
 addEventListener('error',()=>{stopShowcase();},{once:true});
})();
