// The opening reflects actual page/model readiness and always has a way out.
(()=>{
 const veil=document.querySelector('#boot-screen'),status=document.querySelector('#boot-status'),skip=document.querySelector('#boot-skip');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let complete=false,stage=-1,timer;
 const start=performance.now();
 function setStage(next,label){
  if(next<=stage)return;
  stage=next;veil.dataset.stage=String(stage);status.textContent=label;
 }
 function finish(){
  if(complete)return;
  complete=true;clearInterval(timer);
  veil.setAttribute('aria-hidden','true');skip.blur();
  document.documentElement.classList.remove('booting');
  setTimeout(()=>veil.remove(),700);
 }
 function check(){
  if(!document.documentElement.classList.contains('booting')){finish();return;}
  const elapsed=performance.now()-start;
  if(elapsed>=220&&document.readyState!=='loading')setStage(1,'ASSEMBLING THE INTERFACE');
  if(elapsed>=520&&document.readyState==='complete')setStage(2,'CALIBRATING THE MACHINE');
  if(elapsed>=850&&document.querySelector('.hero-art.has-3d')){
   setStage(3,'MACHINE ONLINE');
   if(elapsed>=1250)finish();
  }
 }
 skip.addEventListener('click',finish);
 setStage(0,'POWERING THE FORGE');
 if(reduced.matches){finish();return;}
 timer=setInterval(check,90);check();
 window.addEventListener('load',check,{once:true});
})();
