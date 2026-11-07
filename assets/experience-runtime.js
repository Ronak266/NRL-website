// DOM choreography: immediate navigation, quiet motion and explicit controls.
const xrayButton=document.querySelector('#xray');
xrayButton.addEventListener('click',()=>{const on=xrayButton.getAttribute('aria-pressed')!=='true';xrayButton.setAttribute('aria-pressed',String(on));});
let progressPending=false;
function updateReading(){const height=document.documentElement.scrollHeight-innerHeight;document.querySelector('#reading-progress').style.transform='scaleX('+(height>0?clamp(scrollY/height):0)+')';progressPending=false;}
addEventListener('scroll',()=>{if(!progressPending){progressPending=true;requestAnimationFrame(updateReading);}},{passive:true});addEventListener('resize',updateReading);updateReading();
if(matchMedia('(pointer:fine)').matches){
 document.querySelector('#cards').addEventListener('pointermove',e=>{const card=e.target.closest('.card');if(!card||matchMedia('(prefers-reduced-motion:reduce)').matches||document.body.classList.contains('paused'))return;const r=card.getBoundingClientRect();card.style.transform='perspective(900px) rotateX('+(-(e.clientY-r.top-r.height/2)/r.height*7)+'deg) rotateY('+((e.clientX-r.left-r.width/2)/r.width*7)+'deg) translateY(-4px)';});
 document.querySelector('#cards').addEventListener('pointerout',e=>{const card=e.target.closest('.card');if(card&&!card.contains(e.relatedTarget))card.style.transform='';});
}
