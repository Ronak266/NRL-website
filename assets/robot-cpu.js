// Perspective renderer for browsers without WebGL; uses the same 3D geometry.
export async function mountSoftwareRobot(host, fallback, status) {
  const response=await fetch(new URL('./robot.json',import.meta.url));
  if(!response.ok)throw new Error('Robot geometry unavailable');
  const parts=await response.json();
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas unavailable');
  canvas.className='robot-canvas';canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Interactive 3D concept robot. Drag to orbit or use the rotation control.');
  host.append(canvas);host.classList.add('has-3d');fallback.style.display='none';
  status.textContent='LIVE 3D / COMPATIBILITY MODE';
  const rotate=document.querySelector('#rotate');rotate.min=-180;rotate.max=180;
  rotate.setAttribute('aria-label','Orbit 3D robot');
  let w=0,h=0,yaw=.5,pitch=.12,visible=true,drag=false,x=0,y=0,previous=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  new ResizeObserver(()=>{w=host.clientWidth;h=host.clientHeight;const d=Math.min(devicePixelRatio,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}).observe(host);
  new IntersectionObserver(e=>visible=e[0].isIntersecting,{rootMargin:'100px'}).observe(host);
  canvas.onpointerdown=e=>{drag=true;x=e.clientX;y=e.clientY;canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-x)*.009;pitch=Math.max(-.3,Math.min(.4,pitch+(e.clientY-y)*.004));x=e.clientX;y=e.clientY;rotate.value=Math.round(yaw*180/Math.PI);};
  canvas.onpointerup=canvas.onpointercancel=()=>drag=false;
  rotate.addEventListener('input',()=>yaw=Number(rotate.value)*Math.PI/180);
  const faces=[[[0,1,3,2],.38],[[4,6,7,5],1.12],[[0,4,5,1],.7],[[2,3,7,6],1.35],[[0,2,6,4],.65],[[1,5,7,3],.9]];
  function render(time){
    requestAnimationFrame(render);if(!visible||document.hidden||time-previous<32||!w||!h)return;previous=time;
    const frozen=document.body.classList.contains('paused')||reduced.matches;
    const angle=yaw+(frozen?0:Math.sin(time*.00025)*.08);
    const project=([x,y,z])=>{const xx=x*Math.cos(angle)+z*Math.sin(angle);let zz=x*Math.sin(angle)-z*Math.cos(angle);y-=1.9;const yy=y*Math.cos(pitch)-zz*Math.sin(pitch);zz=y*Math.sin(pitch)+zz*Math.cos(pitch);const scale=Math.min(w*1.3,h*1.6)/(8+zz);return [w/2+xx*scale,h*.5-yy*scale,zz];};
    ctx.fillStyle='#101719';ctx.fillRect(0,0,w,h);
    function line(points,color,width=1){ctx.beginPath();points.forEach((p,i)=>{const v=project(p);if(i)ctx.lineTo(v[0],v[1]);else ctx.moveTo(v[0],v[1]);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
    for(let j=-7;j<=7;j++){line([[j,-.15,-7],[j,-.15,7]],'#243137');line([[-7,-.15,j],[7,-.15,j]],'#243137');}
    for(const [r,col] of [[2.15,'#dd622f'],[2.6,'#3a494d']])line(Array.from({length:81},(_,i)=>[r*Math.cos(i*Math.PI/40),0,r*Math.sin(i*Math.PI/40)]),col,1.5);
    const p=Number(document.querySelector('#percent').textContent)/100;
    const exploded=document.querySelector('#explode').getAttribute('aria-pressed')==='true';
    const separation=exploded?1:(frozen?0:1-p),polygons=[];
    const wire=document.querySelector('#wire').getAttribute('aria-pressed')==='true';
    parts.forEach((part,i)=>{
      let [x,y,z]=part.p;const [sx,sy,sz]=part.s;
      const a=Math.max(0,Math.min(1,separation*1.7-part.g*.18));
      x+=(x===0?(i%2?1:-1):Math.sign(x))*a*(.6+Math.abs(x)*.5);y+=a*(part.g===2?1.3:part.g===0?-.12:.2);z+=a*(i%2?.55:-.55);
      const verts=[];for(const zz of [-1,1])for(const yy of [-1,1])for(const xx of [-1,1])verts.push(project([x+xx*sx/2,y+yy*sy/2,z+zz*sz/2]));
      const rgb=[1,3,5].map(k=>parseInt(part.c.slice(k,k+2),16));
      faces.forEach(([ids,light])=>{const v=ids.map(i=>verts[i]);polygons.push({v,z:v.reduce((sum,p)=>sum+p[2],0)/4,c:rgb.map(c=>Math.min(255,Math.round(c*light)))});});
    });
    polygons.sort((a,b)=>b.z-a.z).forEach(({v,c})=>{ctx.beginPath();v.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(!wire){ctx.fillStyle='rgb('+c.join(',')+')';ctx.fill();}ctx.strokeStyle=wire?'#ff8a56':'#778c91';ctx.lineWidth=wire?.7:.5;ctx.stroke();});
  }
  requestAnimationFrame(render);
}
