import {polygonsFor,projectPoint} from './robot-geometry.js';
// The compatibility renderer uses the same 3D meshes and perspective as the GPU scene.
export async function mountSoftwareRobot(host,fallback,status){
 const response=await fetch(new URL('./robot.json',import.meta.url));
 if(!response.ok)throw new Error('Robot geometry unavailable');
 const parts=await response.json(),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('Canvas unavailable');
 canvas.className='robot-canvas';canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label','Photo-referenced Hyperdrive robot with four traction wheels, clear chassis, front CORE mechanism and exposed controller. Drag to orbit.');
 host.append(canvas);host.classList.add('has-3d');fallback.style.display='none';
 status.textContent='HYPERDRIVE / LIVE 3D';
 const rotate=document.querySelector('#rotate');rotate.min=-180;rotate.max=180;rotate.value=32;rotate.setAttribute('aria-label','Orbit Hyperdrive chassis');
 let w=0,h=0,yaw=.55,pitch=.56,visible=true,drag=false,x=0,y=0,previous=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 new ResizeObserver(()=>{w=host.clientWidth;h=host.clientHeight;const d=Math.min(devicePixelRatio,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}).observe(host);
 new IntersectionObserver(e=>visible=e[0].isIntersecting,{rootMargin:'100px'}).observe(host);
 canvas.onpointerdown=e=>{drag=true;x=e.clientX;y=e.clientY;canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-x)*.009;pitch=Math.max(.15,Math.min(1.1,pitch+(e.clientY-y)*.004));x=e.clientX;y=e.clientY;rotate.value=Math.round(yaw*180/Math.PI);};
 canvas.onpointerup=canvas.onpointercancel=()=>drag=false;
 rotate.addEventListener('input',()=>yaw=Number(rotate.value)*Math.PI/180);
 function render(time){
  requestAnimationFrame(render);if(!visible||document.hidden||time-previous<40||!w||!h)return;previous=time;
  const frozen=document.body.classList.contains('paused')||reduced.matches;
  const view={yaw:yaw+(frozen?0:Math.sin(time*.0002)*.045),pitch,width:w,height:h};
  ctx.globalAlpha=1;ctx.fillStyle='#101719';ctx.fillRect(0,0,w,h);
  const line=(points,color)=>{ctx.beginPath();points.forEach((p,i)=>{const v=projectPoint(p,view);i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]);});ctx.strokeStyle=color;ctx.lineWidth=.6;ctx.stroke();};
  for(let j=-6;j<=6;j++){line([[j,0,-6],[j,0,6]],'#233238');line([[-6,0,j],[6,0,j]],'#233238');}
  const p=Number(document.querySelector('#percent').textContent)/100;
  const exploded=document.querySelector('#explode').getAttribute('aria-pressed')==='true';
  const separation=exploded?1:(frozen?0:1-p);
  const wire=document.querySelector('#wire').getAttribute('aria-pressed')==='true';
  for(const {points,color,alpha,name} of polygonsFor(parts,separation,view)){
   ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
   if(!wire){ctx.globalAlpha=alpha;ctx.fillStyle='rgb('+color.join(',')+')';ctx.fill();}
   ctx.globalAlpha=wire?.7:alpha<1?.36:.35;
   ctx.strokeStyle=wire?'#e59c58':name.includes('Rubber')||name.includes('tread')?'#435057':'#b2cad1';ctx.lineWidth=wire?.55:.32;ctx.stroke();
  }
  ctx.globalAlpha=1;
 }
 requestAnimationFrame(render);
}
