// Functional controls; page assembly is coordinated by agentic-build.js.
const cinematicReduced=matchMedia('(prefers-reduced-motion: reduce)'),heroSection=document.querySelector('.hero');
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

// Module panels are real shortcuts into the matching subassembly.
for(const tile of document.querySelectorAll('.module-tile'))tile.addEventListener('click',()=>{
 const tab=document.querySelector('.system-tabs button[data-system="'+tile.dataset.systemJump+'"]');
 tab.click();
 document.querySelector('#assembly').scrollIntoView({behavior:cinematicReduced.matches||document.body.classList.contains('paused')?'auto':'smooth',block:'start'});
 tab.focus({preventScroll:true});
});

