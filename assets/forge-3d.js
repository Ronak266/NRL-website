import * as THREE from './three.module.js';

const host = document.querySelector('#lab-stage');
const fallback = document.querySelector('#lab-robot');
const status = document.querySelector('#render-status');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = THREE.MathUtils.clamp;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x101416, 1);
  renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional Titan Forge concept robot. Drag to orbit or use the rotation control.');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.className = 'robot-canvas';
  host.append(renderer.domElement);
  const response = await fetch(new URL('./robot.json', import.meta.url));
  if (!response.ok) throw new Error('Robot geometry unavailable');
  const parts = await response.json();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.set(5.8, 4.2, 8.6);
  camera.lookAt(0, 2, 0);
  scene.add(new THREE.HemisphereLight(0xc8e0e5, 0x24201c, 2.3));
  const key = new THREE.DirectionalLight(0xffffff, 4.5);
  key.position.set(3, 7, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff642d, 3);
  rim.position.set(-4, 3, -3); scene.add(rim);
  const robot = new THREE.Group(); scene.add(robot);
  const meshes = parts.map((part, i) => {
    const geometry = new THREE.BoxGeometry(...part.s);
    const material = new THREE.MeshStandardMaterial({color:part.c,metalness:.72,roughness:.33,emissive:part.glow?part.c:0x000000,emissiveIntensity:part.glow?1.2:0});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.position.fromArray(part.p);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0xa8b9be,transparent:true,opacity:.16}));
    mesh.add(edges); robot.add(mesh);
    return {mesh,part,i};
  });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.3,.16,64),new THREE.MeshStandardMaterial({color:0x20282b,metalness:.8,roughness:.5}));
  pedestal.position.y=-.06; pedestal.receiveShadow=true; scene.add(pedestal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.12,.012,8,100),new THREE.MeshBasicMaterial({color:0xff642d}));
  ring.rotation.x=Math.PI/2; ring.position.y=.04; scene.add(ring);
  const grid = new THREE.GridHelper(24,32,0x3c4c50,0x202d31);grid.position.y=-.15;scene.add(grid);
  fallback.style.display='none'; host.classList.add('has-3d'); status.textContent='LIVE 3D / DRAG TO ORBIT';
  const rotate=document.querySelector('#rotate');rotate.min=-180;rotate.max=180;rotate.setAttribute('aria-label','Orbit 3D robot');
  let yaw=.15,pitch=0,dragging=false,lastX=0,lastY=0,visible=true,previous=0;
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.009;pitch=clamp(pitch+(e.clientY-lastY)*.004,-.3,.3);lastX=e.clientX;lastY=e.clientY;rotate.value=String(Math.round(yaw*180/Math.PI));});
  canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  rotate.addEventListener('input',()=>yaw=Number(rotate.value)*Math.PI/180);
  new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(host);
  new IntersectionObserver(entries=>visible=entries[0].isIntersecting,{rootMargin:'100px'}).observe(host);
  const materials=new Set(meshes.map(({mesh})=>mesh.material));
  document.querySelector('#wire').addEventListener('click',()=>{const on=document.querySelector('#wire').getAttribute('aria-pressed')==='true';materials.forEach(m=>m.wireframe=on);});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);canvas.style.display='none';fallback.style.display='';status.textContent='ILLUSTRATED FALLBACK / 3D UNAVAILABLE';});
  const desired=new THREE.Vector3();
  renderer.setAnimationLoop(time=>{
    if(!visible||document.hidden||time-previous<32)return;
    const dt=Math.min((time-previous)/1000,.05);previous=time;
    const frozen=document.body.classList.contains('paused')||reduced.matches;
    const assembled=Number(document.querySelector('#percent').textContent)/100;
    const exploded=document.querySelector('#explode').getAttribute('aria-pressed')==='true';
    const separation=exploded?1:(frozen?0:1-assembled);
    for(const {mesh,part,i} of meshes){
      const sign=part.p[0]===0?(i%2?1:-1):Math.sign(part.p[0]);
      const amount=clamp(separation*1.7-part.g*.18,0,1);
      desired.set(part.p[0]+sign*amount*(.6+Math.abs(part.p[0])*.5),part.p[1]+amount*(part.g===2?1.3:part.g===0?-.12:.2),part.p[2]+amount*(i%2?.55:-.55));
      if(frozen)mesh.position.copy(desired);else mesh.position.lerp(desired,1-Math.exp(-dt*9));
    }
    robot.rotation.y=yaw+(frozen?0:Math.sin(time*.00025)*.08);robot.rotation.x=pitch;
    renderer.render(scene,camera);
  });
} catch(error) {
  renderer?.dispose(); renderer?.domElement.remove();
  try {
    const {mountSoftwareRobot}=await import('./robot-cpu.js');
    await mountSoftwareRobot(host,fallback,status);
  } catch(fallbackError) {
    fallback.style.display='';status.textContent='ILLUSTRATED MODE / 3D UNAVAILABLE';
    console.warn('3D unavailable; illustrated assembly remains usable.',fallbackError);
  }
}

const video=document.querySelector('#simulation-video');
document.querySelectorAll('[data-chapter]').forEach(button=>button.addEventListener('click',()=>{
  video.currentTime=Number(button.dataset.chapter);
  video.play().catch(()=>{});
}));
video.addEventListener('timeupdate',()=>{
  document.querySelector('#sim-time').textContent=video.currentTime.toFixed(1)+' / 12.0s';
  document.querySelectorAll('[data-chapter]').forEach((button,i)=>{
    const on=Math.min(2,Math.floor(video.currentTime/4))===i;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));
  });
});
video.addEventListener('error',()=>document.querySelector('#video-status').textContent='Video unavailable. Please reload or download the simulation.');
document.querySelector('#motion').addEventListener('click',()=>{if(document.body.classList.contains('paused'))video.pause();});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause();}).observe(video);
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
