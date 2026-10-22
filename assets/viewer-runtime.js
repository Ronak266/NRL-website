// This file is combined with the model and geometry by scripts/build-preview.py.
// Classic script: no imports, fetch requests, or WebGL are required.
function mountViewer(host,fallback,{hero=false}={}){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 if(!ctx)return;
 canvas.className='robot-canvas';canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label',hero?'Animated three-dimensional Hyperdrive chassis. Drag to rotate.':'Interactive Hyperdrive chassis. Drag to rotate, or use the rotation, assembly and wireframe controls.');
 host.append(canvas);fallback.style.display='none';host.classList.add('has-3d');
 if(!hero)document.querySelector('#render-status').textContent='LIVE 3D · DRAG TO ROTATE';
 let w=0,h=0,yaw=.55,pitch=.56,visible=true,drag=false,x=0,y=0,previous=0,frames=0;
 const rotate=document.querySelector('#rotate'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!hero){rotate.min=-180;rotate.max=180;rotate.value=32;rotate.setAttribute('aria-label','Orbit Hyperdrive chassis');rotate.addEventListener('input',()=>yaw=Number(rotate.value)*Math.PI/180);}
 new ResizeObserver(()=>{w=host.clientWidth;h=host.clientHeight;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}).observe(host);
 new IntersectionObserver(e=>visible=e[0].isIntersecting,{rootMargin:'80px'}).observe(host);
 canvas.onpointerdown=e=>{drag=true;x=e.clientX;y=e.clientY;canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-x)*.009;pitch=Math.max(.15,Math.min(1.1,pitch+(e.clientY-y)*.004));x=e.clientX;y=e.clientY;if(!hero)rotate.value=Math.round(yaw*180/Math.PI);};
 canvas.onpointerup=canvas.onpointercancel=()=>drag=false;
 let heroPaused=false;const toggle=document.querySelector('#hero-orbit');
 if(hero)toggle.addEventListener('click',()=>{heroPaused=!heroPaused;toggle.textContent=heroPaused?'RESUME ROTATION ▷':'PAUSE ROTATION Ⅱ';toggle.setAttribute('aria-pressed',String(heroPaused));});
 function render(time){
  requestAnimationFrame(render);
  if(!visible||document.hidden||time-previous<40||!w||!h)return;
  const dt=Math.min((time-previous)/1000,.06);previous=time;
  const frozen=document.body.classList.contains('paused')||reduced.matches;
  if(hero&&!frozen&&!heroPaused&&!drag)yaw+=dt*.22;
  const view={yaw,pitch,width:w,height:h,scale:hero?.93:1};
  ctx.globalAlpha=1;ctx.clearRect(0,0,w,h);
  if(!hero){const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#152c60');bg.addColorStop(1,'#111e40');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);}
  const line=(points,color)=>{ctx.beginPath();points.forEach((p,i)=>{const v=projectPoint(p,view);i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]);});ctx.strokeStyle=color;ctx.lineWidth=.6;ctx.stroke();};
  for(let j=-5;j<=5;j++){line([[j,0,-5],[j,0,5]],hero?'#315ab11e':'#91b9ff24');line([[-5,0,j],[5,0,j]],hero?'#315ab11e':'#91b9ff24');}
  const p=Number(document.querySelector('#percent').textContent)/100;
  const exploded=!hero&&document.querySelector('#explode').getAttribute('aria-pressed')==='true';
  const separation=hero?0:exploded?1:frozen?0:1-p;
  const wire=!hero&&document.querySelector('#wire').getAttribute('aria-pressed')==='true';
  for(const {points,color,alpha,name} of polygonsFor(parts,separation,view)){
   ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
   if(!wire){ctx.globalAlpha=alpha;ctx.fillStyle='rgb('+color.join(',')+')';ctx.fill();}
   ctx.globalAlpha=wire?.8:alpha<1?.45:.28;
   ctx.strokeStyle=wire?'#9df1e8':name.includes('Rubber')||name.includes('tread')?'#526b8a':hero?'#6d92c9':'#b2cad1';ctx.lineWidth=wire?.6:.35;ctx.stroke();
  }
  ctx.globalAlpha=1;frames++;if(frames%15===0)host.dataset.frames=frames;
 }
 requestAnimationFrame(render);
}
mountViewer(document.querySelector('.hero-art'),document.querySelector('.hero-robot'),{hero:true});
mountViewer(document.querySelector('#lab-stage'),document.querySelector('#lab-robot'));

// Video controls initialize separately from either renderer.
const video=document.querySelector('#simulation-video'),videoScreen=document.querySelector('.sim-screen');
const start=document.querySelector('#video-start'),playback=document.querySelector('#playback-status');
let requestId=0;
function ready(){
 if(video.readyState>=1)return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>finish(new Error('The video is taking too long to load.')),15000);
  const loaded=()=>finish(),error=()=>finish(new Error('The video could not be loaded.'));
  function finish(err){clearTimeout(timer);video.removeEventListener('loadedmetadata',loaded);video.removeEventListener('error',error);err?reject(err):resolve();}
  video.addEventListener('loadedmetadata',loaded,{once:true});video.addEventListener('error',error,{once:true});
  if(video.networkState===3||video.error)video.load();
 });
}
async function playClip(at){
 const id=++requestId;playback.textContent='Loading the simulation…';start.disabled=true;
 try{
  await ready();if(id!==requestId)return;
  if(Number.isFinite(at))video.currentTime=Math.min(at,Math.max(0,video.duration-.1));
  await video.play();playback.textContent='Playing · 720p · silent';
 }catch(error){playback.textContent='Use the video’s play button, or download the MP4 below. '+error.message;}
 finally{start.disabled=false;}
}
start.addEventListener('click',()=>playClip(video.ended?0:undefined));
document.querySelectorAll('[data-chapter]').forEach(button=>button.addEventListener('click',()=>playClip(Number(button.dataset.chapter))));
video.addEventListener('playing',()=>{videoScreen.classList.add('is-playing');playback.textContent='Playing · 720p · silent';});
video.addEventListener('pause',()=>{videoScreen.classList.remove('is-playing');start.textContent=video.ended?'REPLAY SIMULATION ↻':'CONTINUE SIMULATION ▷';if(!video.ended)playback.textContent='Paused';});
video.addEventListener('ended',()=>{videoScreen.classList.remove('is-playing');start.textContent='REPLAY SIMULATION ↻';playback.textContent='Finished · choose a chapter or replay';});
video.addEventListener('error',()=>{videoScreen.classList.remove('is-playing');playback.textContent='Video unavailable. Extract the entire ZIP, including the assets folder, or open Titan-Forge-Preview.html.';});
video.addEventListener('timeupdate',()=>{
 document.querySelector('#sim-time').textContent=video.currentTime.toFixed(1)+' / '+(Number.isFinite(video.duration)?video.duration.toFixed(1):'12.0')+'s';
 document.querySelectorAll('[data-chapter]').forEach((b,i)=>{const on=Math.min(2,Math.floor(video.currentTime/4))===i;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&!video.paused)video.pause();},{threshold:0}).observe(video);
document.querySelector('#motion').addEventListener('click',()=>{if(document.body.classList.contains('paused'))video.pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
