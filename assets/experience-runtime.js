// DOM choreography: immediate navigation, quiet motion and explicit controls.
const xrayButton=document.querySelector('#xray');
xrayButton.addEventListener('click',()=>{const on=xrayButton.getAttribute('aria-pressed')!=='true';xrayButton.setAttribute('aria-pressed',String(on));});
let progressPending=false;
function updateReading(){const height=document.documentElement.scrollHeight-innerHeight;document.querySelector('#reading-progress').style.transform='scaleX('+(height>0?clamp(scrollY/height):0)+')';progressPending=false;}
addEventListener('scroll',()=>{if(!progressPending){progressPending=true;requestAnimationFrame(updateReading);}},{passive:true});addEventListener('resize',updateReading);updateReading();
