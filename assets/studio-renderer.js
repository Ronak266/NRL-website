// Physically based studio renderer; the classic Canvas viewer remains the fallback.
function mountStudio(host,fallback,{hero=false}={}){
 let renderer;
 try {
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:hero,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();if(!hero)scene.background=new THREE.Color('#101013');
  const camera=new THREE.PerspectiveCamera(34,1,.1,150);
  // Local softbox environment: no network textures or third-party asset dependencies.
  const room=new THREE.Scene();room.background=new THREE.Color('#303038');
  for(const [position,size,color,intensity] of [[[-4,6,3],[3,5,.1],0xeaf3ff,4],[[5,4,0],[2,4,.1],0xffffff,3],[[0,5,-5],[5,2,.1],0xff2848,2]]){
   const panel=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity)}));panel.position.set(...position);panel.lookAt(0,1,0);room.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.08);scene.environment=environment.texture;pmrem.dispose();
  room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  scene.add(new THREE.HemisphereLight(0xc7d6e8,0x292027,.8));
  const key=new THREE.DirectionalLight(0xfff2e7,3.2);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:10,bottom:-8,far:35});key.shadow.bias=-.0003;key.shadow.normalBias=.025;key.shadow.radius=4;scene.add(key);
  const rim=new THREE.DirectionalLight(0xff2449,1.5);rim.position.set(4,3,-4);scene.add(rim);
  const robot=new THREE.Group();scene.add(robot);
  const meshes=parts.map(part=>{
   const vertices=[],normals=[],adj=part.v.map(()=>[]);
   const faces=part.f.map(face=>{
    const a=new THREE.Vector3().fromArray(part.v[face[0]]),b=new THREE.Vector3().fromArray(part.v[face[1]]),c=new THREE.Vector3().fromArray(part.v[face[2]]);
    const n=b.sub(a).cross(c.sub(a)).normalize();face.forEach(k=>adj[k].push(n));return {face,n};
   });
   for(const {face,n} of faces)for(let j=1;j<face.length-1;j++)for(const k of [face[0],face[j],face[j+1]]){
    vertices.push(...part.v[k]);const normal=new THREE.Vector3();for(const neighbor of adj[k])if(neighbor.dot(n)>.75)normal.add(neighbor);normal.normalize();normals.push(normal.x,normal.y,normal.z);
   }
   const shape=new THREE.BufferGeometry();shape.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));shape.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
   const metal=part.material==='metal',glass=part.material==='glass',rubber=part.material==='rubber';
   const material=new THREE.MeshPhysicalMaterial({color:glass?0xdcecf0:part.c,metalness:metal?.92:0,roughness:glass?.09:metal?.26:rubber?.88:.42,clearcoat:rubber?0:.12,clearcoatRoughness:.3,side:THREE.DoubleSide,transparent:glass,opacity:glass?.24:1,depthWrite:!glass,envMapIntensity:metal?1.3:.7});
   const mesh=new THREE.Mesh(shape,material);mesh.castShadow=!glass;mesh.receiveShadow=true;mesh.position.fromArray(part.p);robot.add(mesh);return {mesh,part};
  });
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x17171b,metalness:.18,roughness:.62}));floor.rotation.x=-Math.PI/2;floor.position.y=-.7;floor.receiveShadow=true;scene.add(floor);
  const canvas=renderer.domElement;canvas.className='robot-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Studio-lit Hyperdrive robot. Drag to orbit.');
  host.append(canvas);fallback.style.display='none';host.classList.add('has-3d');
  if(!hero)document.querySelector('#render-status').textContent='STUDIO 3D · REAL-TIME MATERIALS';
  let yaw=.55,pitch=.55,visible=true,drag=false,lastX=0,lastY=0,last=0,paused=false,previousFocus='',lastSeparation=-1;
  const rotate=document.querySelector('#rotate'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),box=new THREE.Box3(),center=new THREE.Vector3(),size=new THREE.Vector3(),target=new THREE.Vector3(0,.8,0);
  if(!hero)rotate.addEventListener('input',()=>yaw=Number(rotate.value)*Math.PI/180);
  canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-lastX)*.008;pitch=clamp(pitch+(e.clientY-lastY)*.004,.12,1.25);lastX=e.clientX;lastY=e.clientY;if(!hero)rotate.value=Math.round(yaw*180/Math.PI);});
  canvas.onpointerup=canvas.onpointercancel=()=>drag=false;
  if(hero)document.querySelector('#hero-orbit').addEventListener('click',e=>{paused=!paused;e.currentTarget.textContent=paused?'RESUME ROTATION ▷':'PAUSE ROTATION Ⅱ';e.currentTarget.setAttribute('aria-pressed',String(paused));});
  new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();}).observe(host);
  new IntersectionObserver(e=>visible=e[0].isIntersecting,{rootMargin:'80px'}).observe(host);
  let radius=4;
  renderer.setAnimationLoop(time=>{
   if(!visible||document.hidden||time-last<33)return;const dt=Math.min((time-last)/1000,.05);last=time;
   const frozen=document.body.classList.contains('paused')||reduced.matches;
   if(hero&&!paused&&!drag&&!frozen)yaw+=dt*.10;
   const separation=hero?0:Number(host.dataset.separation||0),focus=hero?'all':host.dataset.system||'all',wire=!hero&&document.querySelector('#wire').getAttribute('aria-pressed')==='true';
   for(const {mesh,part} of meshes){mesh.position.fromArray(offsetPart(part,separation));mesh.visible=focus==='all'||part.system===focus;mesh.material.wireframe=wire;}
   if(separation!==lastSeparation||focus!==previousFocus){
    box.makeEmpty();for(const {mesh} of meshes)if(mesh.visible)box.expandByObject(mesh);box.getCenter(center);box.getSize(size);radius=size.length()*.52;previousFocus=focus;lastSeparation=separation;
   }
   target.lerp(center,frozen?1:1-Math.exp(-dt*8));
   const distance=radius/Math.sin(Math.atan(Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect)))*1.05;
   camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(target);
   renderer.render(scene,camera);host.dataset.renderedSeparation=separation.toFixed(3);
  });
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);canvas.remove();mountViewer(host,fallback,{hero,softwareOnly:true});});
  return true;
 }catch(error){renderer?.dispose();renderer?.domElement.remove();console.info('Using offline-compatible Canvas renderer.',error);return false;}
}
