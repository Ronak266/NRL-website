// Explicit inspection controls for the proposed two-servo pickup module.
const mechanismHost=document.querySelector('#lab-stage');
const gripControl=document.querySelector('#gripper-position'),liftControl=document.querySelector('#lift-position'),pickupButton=document.querySelector('#pickup-demo'),mechanismStatus=document.querySelector('#mechanism-status');
let pickupRunning=false,pickupLast=0,pickupElapsed=0;
function setPickupPose(grip,lift){
 mechanismHost.dataset.grip=String(clamp(grip));mechanismHost.dataset.lift=String(clamp(lift));
 gripControl.value=Math.round(grip*100);liftControl.value=Math.round(lift*100);
 document.querySelector('#gripper-value').textContent=Math.round(grip*100)+'%';document.querySelector('#lift-value').textContent=Math.round(lift*100)+'%';
}
function assembleForPickup(){
 const slider=document.querySelector('#separation');slider.value=0;slider.dispatchEvent(new Event('input',{bubbles:true}));
}
function stopPickup(){pickupRunning=false;pickupButton.textContent='TEST PICKUP ▷';pickupButton.setAttribute('aria-pressed','false');}
gripControl.addEventListener('input',()=>{
 stopPickup();assembleForPickup();const grip=Number(gripControl.value)/100,lift=Number(liftControl.value)/100;
 if(lift>.01&&grip<.9){setPickupPose(1,lift);mechanismStatus.textContent='Lower the lift before opening the jaws.';return;}
 setPickupPose(grip,lift);mechanismStatus.textContent=grip>.9?'Jaws closed · lift ready':'Jaws open · CORE rests on the pickup supports';
});
liftControl.addEventListener('input',()=>{
 stopPickup();assembleForPickup();setPickupPose(1,Number(liftControl.value)/100);mechanismStatus.textContent='Jaws closed · guided carriage raises the CORE';
});
pickupButton.addEventListener('click',()=>{
 if(pickupRunning){stopPickup();return;}
 assembleForPickup();
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){setPickupPose(1,1);mechanismStatus.textContent='Raised pickup pose · use the sliders to inspect';return;}
 pickupRunning=true;pickupElapsed=0;pickupLast=0;pickupButton.textContent='PAUSE PICKUP Ⅱ';pickupButton.setAttribute('aria-pressed','true');requestAnimationFrame(tickPickup);
});
function tickPickup(time){
 if(!pickupRunning)return;
 const dt=pickupLast?Math.min(.5,(time-pickupLast)/1000):0;pickupLast=time;
 const r=mechanismHost.getBoundingClientRect();
 if(!document.hidden&&!document.body.classList.contains('paused')&&r.bottom>0&&r.top<innerHeight)pickupElapsed+=dt;
 const t=pickupElapsed,smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
 let grip=0,lift=0,label='01 / OPEN · servo drives the two opposing racks';
 if(t>=1&&t<2.5){grip=smooth((t-1)/1.5);label='02 / GRIP · padded jaws close symmetrically';}
 else if(t>=2.5&&t<4.5){grip=1;lift=smooth((t-2.5)/2);label='03 / LIFT · second servo drives the guided rack';}
 else if(t>=4.5&&t<5.5){grip=1;lift=1;label='04 / HOLD · CORE raised between the pads';}
 else if(t>=5.5&&t<7){grip=1;lift=1-smooth((t-5.5)/1.5);label='05 / LOWER · return to the pickup supports';}
 else if(t>=7){grip=1-smooth((t-7)/1.5);label='06 / RELEASE · jaws open after the lift lowers';}
 setPickupPose(grip,lift);mechanismStatus.textContent=label;
 if(t>=8.5){stopPickup();mechanismStatus.textContent='Pickup cycle complete · orbit or scroll to inspect the two servos';return;}
 requestAnimationFrame(tickPickup);
}
document.querySelector('#separation').addEventListener('input',stopPickup);
document.querySelector('#explode').addEventListener('click',stopPickup);
setPickupPose(1,0);
