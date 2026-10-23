function mountArena(){
 const host=document.querySelector('#drive-stage');if(!host)return;
 const status=document.querySelector('#drive-status'),start=document.querySelector('#drive-start'),demoButton=document.querySelector('#drive-demo');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let state=newDriveState(),running=false,demo=false,visible=false,last=0,cameraMode='chase';const held=new Set();
 const setRunning=value=>{running=value;start.textContent=value?'PAUSE DRIVE Ⅱ':'TAKE CONTROL ▷';start.setAttribute('aria-pressed',String(value));if(!value)held.clear();};
 start.onclick=()=>{demo=false;demoButton.setAttribute('aria-pressed','false');setRunning(!running);if(running)host.focus({preventScroll:true});};
 demoButton.onclick=()=>{demo=!demo;demoButton.setAttribute('aria-pressed',String(demo));setRunning(demo);};
 document.querySelector('#drive-reset').onclick=()=>{state=newDriveState();document.querySelector('#cores').textContent='0 / 8';document.querySelector('#drive-message').textContent='Collect the eight gold rings.';demo=false;demoButton.setAttribute('aria-pressed','false');setRunning(false);};
 document.querySelectorAll('[data-drive-camera]').forEach(button=>button.onclick=()=>{cameraMode=button.dataset.driveCamera;document.querySelectorAll('[data-drive-camera]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
 const keys={ArrowUp:'forward',w:'forward',ArrowDown:'back',s:'back',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',Shift:'boost'};
 host.addEventListener('keydown',event=>{const key=keys[event.key]||keys[event.key.toLowerCase()];if(key){event.preventDefault();held.add(key);}});
 host.addEventListener('keyup',event=>{const key=keys[event.key]||keys[event.key.toLowerCase()];if(key){event.preventDefault();held.delete(key);}});
 host.addEventListener('blur',()=>held.clear());window.addEventListener('blur',()=>{held.clear();setRunning(false);});
 document.querySelectorAll('[data-drive]').forEach(button=>{
  const release=()=>held.delete(button.dataset.drive);
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);demo=false;demoButton.setAttribute('aria-pressed','false');setRunning(true);held.add(button.dataset.drive);});
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  button.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();setRunning(true);held.add(button.dataset.drive);}});
  button.addEventListener('keyup',release);button.addEventListener('blur',release);
 });
 new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(!visible){held.clear();setRunning(false);}},{threshold:.08}).observe(host);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();setRunning(false);}});
 let renderer,scene,camera,actor,ringMeshes=[],wheels=[],canvas,ctx,w=1,h=1;
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.background=new THREE.Color('#0c0a11');scene.fog=new THREE.Fog('#0c0a11',23,65);camera=new THREE.PerspectiveCamera(48,1,.1,100);camera.position.set(10,13,16);
  scene.add(new THREE.HemisphereLight(0xe0eafa,0x26101c,2.2));const light=new THREE.DirectionalLight(0xfff3ed,3);light.position.set(-7,15,10);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-13,right:13,top:13,bottom:-13});light.shadow.normalBias=.035;scene.add(light);const red=new THREE.PointLight(0xff143b,50,40,2);red.position.set(0,6,-9);scene.add(red);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(22,22),new THREE.MeshStandardMaterial({color:0x1b1921,roughness:.75,metalness:.3}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(22,22,0x82263e,0x36303c);grid.position.y=.015;scene.add(grid);
  for(const [x,z,sx,sz] of [[-11,0,.15,22],[11,0,.15,22],[0,-11,22,.15],[0,11,22,.15]]){const wall=new THREE.Mesh(new THREE.BoxGeometry(sx,.6,sz),new THREE.MeshStandardMaterial({color:0x420f23,emissive:0x8b102b,emissiveIntensity:.4,metalness:.7,roughness:.3}));wall.position.set(x,.3,z);scene.add(wall);}
  actor=new THREE.Group();actor.scale.setScalar(.55);scene.add(actor);
  const robot=makeRobotMeshes(actor);
  for(const {mesh,part} of robot){if(part.core)mesh.visible=false;if(part.wheel){const pivot=new THREE.Group();pivot.position.fromArray(part.wheel);actor.add(pivot);pivot.add(mesh);mesh.position.set(...part.p.map((v,i)=>v-part.wheel[i]));wheels.push(pivot);}}
  ringMeshes=ringPositions.map(([x,z])=>{const group=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.12,12,48),new THREE.MeshStandardMaterial({color:0xffc747,emissive:0x6d3b00,metalness:.5,roughness:.27}));ring.rotation.x=Math.PI/2;group.add(ring);const halo=new THREE.Mesh(new THREE.TorusGeometry(.8,.012,5,64),new THREE.MeshBasicMaterial({color:0xff334e}));halo.rotation.x=Math.PI/2;halo.position.y=-.12;group.add(halo);group.position.set(x,.3,z);scene.add(group);return group;});
  canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');host.append(canvas);status.textContent='3D PRACTICE ARENA · READY';
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setRunning(false);renderer.dispose();renderer=null;canvas.remove();software();});
 }catch(error){renderer?.dispose();renderer=null;software();}
 function software(){canvas=document.createElement('canvas');ctx=canvas.getContext('2d');canvas.setAttribute('aria-hidden','true');host.append(canvas);status.textContent='COMPATIBLE 3D MODE · READY';resize();}
 function resize(){w=host.clientWidth;h=host.clientHeight;if(renderer){renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}else{canvas.width=w;canvas.height=h;}}
 new ResizeObserver(resize).observe(host);resize();
 function drawSoftware(){
  if(!ctx)return;ctx.fillStyle='#100d15';ctx.fillRect(0,0,w,h);
  const view={yaw:cameraMode==='chase'?state.yaw+Math.PI:.5,pitch:cameraMode==='top'?1.54:.9,width:w,height:h,scale:.8,distance:cameraMode==='chase'?16:32};
  const shift=p=>cameraMode==='chase'?[p[0]-state.x,p[1],p[2]-state.z]:p;
  const project=p=>projectPoint(shift(p),view);
  ctx.lineWidth=1;ctx.strokeStyle='#713044';for(let i=-10;i<=10;i+=2)for(const a of [0,1]){const p=project(a?[i,0,-10]:[-10,0,i]),q=project(a?[i,0,10]:[10,0,i]);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();}
  ringPositions.forEach(([x,z],i)=>{if(state.collected.includes(i))return;const p=project([x,.1,z]);ctx.strokeStyle='#ffc747';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p[0],p[1],8,5,0,0,Math.PI*2);ctx.stroke();});
  const model=parts.filter(p=>!p.core).map(p=>({...p,p:[0,0,0],wheel:null,v:p.v.map(v=>{const x=(v[0]+p.p[0])*.55,z=(v[2]+p.p[2])*.55;return shift([x*Math.cos(state.yaw)+z*Math.sin(state.yaw)+state.x,(v[1]+p.p[1])*.55,-x*Math.sin(state.yaw)+z*Math.cos(state.yaw)+state.z]);})}));
  for(const face of polygonsFor(model,0,view)){ctx.beginPath();face.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.globalAlpha=face.alpha;ctx.fillStyle='rgb('+face.color.join(',')+')';ctx.fill();}ctx.globalAlpha=1;
 }
 const followTarget=new THREE.Vector3(),desired=new THREE.Vector3();let previousCount=0,orbitAngle=.6;
 function frame(time){requestAnimationFrame(frame);const dt=Math.min((time-last)/1000,.05);if(time-last<33)return;last=time;if(!visible||document.hidden)return;
  const frozen=document.body.classList.contains('paused');
  if(running&&!frozen){let throttle=(held.has('forward')?1:0)-(held.has('back')?1:0),steer=(held.has('right')?1:0)-(held.has('left')?1:0);
   if(demo){const index=ringPositions.findIndex((_,i)=>!state.collected.includes(i));if(index<0){setRunning(false);demo=false;demoButton.setAttribute('aria-pressed','false');}else{const [x,z]=ringPositions[index];const angle=Math.atan2(x-state.x,z-state.z)-state.yaw;const error=Math.atan2(Math.sin(angle),Math.cos(angle));steer=clamp(error*1.4,-1,1);throttle=Math.abs(error)>1?.3:.8;}}
   state=stepDrive(state,{throttle,steer,boost:held.has('boost')},dt);
  }
  if(previousCount!==state.collected.length){previousCount=state.collected.length;document.querySelector('#cores').textContent=previousCount+' / 8';document.querySelector('#drive-message').textContent=previousCount===8?'ALL CORES COLLECTED — reset for another run.':previousCount?'CORE collected. Keep exploring.':'Collect the eight gold rings.';}
  document.querySelector('#throttle').textContent=Math.round(Math.abs(state.speed)/6*100)+'%';document.querySelector('#drive-clock').textContent=state.elapsed.toFixed(1)+'s';
  if(renderer){actor.position.set(state.x,0,state.z);actor.rotation.y=state.yaw;wheels.forEach(p=>p.rotation.x=state.travel/.297);ringMeshes.forEach((ring,i)=>{ring.visible=!state.collected.includes(i);ring.position.y=.3+(reduced.matches||frozen?0:Math.sin(time*.0018+i)*.05);});
   if(cameraMode==='top'){desired.set(0,28,.01);followTarget.set(0,0,0);}else if(cameraMode==='orbit'){if(!frozen&&!reduced.matches)orbitAngle+=dt*.1;desired.set(Math.sin(orbitAngle)*20,17,Math.cos(orbitAngle)*20);followTarget.set(0,0,0);}else{desired.set(state.x-Math.sin(state.yaw)*8,6,state.z-Math.cos(state.yaw)*8);followTarget.set(state.x,0,state.z);}
   camera.position.lerp(desired,reduced.matches?1:1-Math.exp(-dt*4));camera.lookAt(followTarget);renderer.render(scene,camera);
  }else drawSoftware();
 }
 requestAnimationFrame(frame);
}
mountArena();
