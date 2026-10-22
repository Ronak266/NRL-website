import * as THREE from './three.module.js';
import {offsetPart} from './robot-geometry.js';

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
  renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional Titan Forge Hyperdrive chassis. Drag to orbit or use the rotation control.');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.className = 'robot-canvas';
  host.append(renderer.domElement);
  const response = await fetch(new URL('./robot.json', import.meta.url));
  if (!response.ok) throw new Error('Robot geometry unavailable');
  const parts = await response.json();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.set(5.8, 6, 8.8);
  camera.lookAt(0, .75, .2);
  scene.add(new THREE.HemisphereLight(0xc8e0e5, 0x24201c, 2.3));
  const key = new THREE.DirectionalLight(0xffffff, 4.5);
  key.position.set(3, 7, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff642d, 3);
  rim.position.set(-4, 3, -3); scene.add(rim);
  const robot = new THREE.Group(); scene.add(robot);
  const meshes = parts.map((part, i) => {
    const geometry=new THREE.BufferGeometry(),vertices=[];
    for(const face of part.f)for(let j=1;j<face.length-1;j++)for(const index of [face[0],face[j],face[j+1]])vertices.push(...part.v[index]);
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({color:part.c,metalness:part.alpha<1?.05:.5,roughness:part.alpha<1?.16:.4,transparent:part.alpha<1,opacity:part.alpha,depthWrite:part.alpha===1,side:THREE.DoubleSide});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = part.alpha===1; mesh.receiveShadow = true;
    mesh.position.fromArray(part.p);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry,25),new THREE.LineBasicMaterial({color:0xa8b9be,transparent:true,opacity:.16}));
    mesh.add(edges); robot.add(mesh);
    return {mesh,part,i};
  });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.55,2.7,.08,64),new THREE.MeshStandardMaterial({color:0x20282b,metalness:.8,roughness:.5}));
  pedestal.position.y=-.06; pedestal.receiveShadow=true; scene.add(pedestal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6,.012,8,100),new THREE.MeshBasicMaterial({color:0xff642d}));
  ring.rotation.x=Math.PI/2; ring.position.y=.04; scene.add(ring);
  const grid = new THREE.GridHelper(24,32,0x3c4c50,0x202d31);grid.position.y=-.15;scene.add(grid);
  fallback.style.display='none'; host.classList.add('has-3d'); status.textContent='HYPERDRIVE / DRAG TO ORBIT';
  const rotate=document.querySelector('#rotate');rotate.min=-180;rotate.max=180;rotate.setAttribute('aria-label','Orbit 3D robot');
  let yaw=.1,pitch=0,dragging=false,lastX=0,lastY=0,visible=true,previous=0;
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
      desired.fromArray(offsetPart(part,separation));
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
