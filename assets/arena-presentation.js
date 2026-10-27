// Locally generated material maps and shared geometry; no external asset requests.
function createArenaPresentation(scene,renderer){
 let seed=187;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function texture(kind){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle=kind==='wood'?'#a08260':kind==='rubber'?'#35373a':'#969b9f';g.fillRect(0,0,256,256);
  for(let i=0;i<3500;i++){const n=Math.floor(80+random()*100);g.fillStyle='rgba('+n+','+n+','+n+','+(kind==='metal'?.08:.2)+')';g.fillRect(random()*256,random()*256,kind==='metal'?12:1,1);}
  if(kind==='wood')for(let i=0;i<120;i++){g.strokeStyle='rgba(55,30,12,'+(random()*.15)+')';g.beginPath();g.moveTo(0,random()*256);g.bezierCurveTo(70,random()*256,180,random()*256,256,random()*256);g.stroke();}
  if(kind==='rubber')for(let y=0;y<256;y+=16){g.fillStyle='#17191b';g.fillRect(0,y,256,3);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='foam'?12:kind==='metal'?3:1,kind==='foam'?12:1);t.anisotropy=Math.min(4,renderer.capabilities?.getMaxAnisotropy?.()||1);return t;
 }
 const foam=texture('foam'),grain=texture('metal'),woodMap=texture('wood'),rubberMap=texture('rubber');woodMap.colorSpace=THREE.SRGBColorSpace;
 const steel=new THREE.MeshStandardMaterial({color:0xbcc4cd,metalness:.9,roughness:.31,bumpMap:grain,bumpScale:.007,envMapIntensity:1.1});
 const rubber=new THREE.MeshStandardMaterial({color:0x242629,metalness:0,roughness:.92,bumpMap:rubberMap,bumpScale:.018});
 const wood=new THREE.MeshStandardMaterial({map:woodMap,roughness:.78,metalness:0,bumpMap:woodMap,bumpScale:.008});
 const dark=new THREE.MeshStandardMaterial({color:0x252b31,roughness:.64,metalness:.55});
 function box(parent,size,material,position){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 // A photographic-style light environment supplies broad reflections to metal.
 const e=document.createElement('canvas');e.width=1024;e.height=512;const eg=e.getContext('2d');eg.fillStyle='#42464d';eg.fillRect(0,0,1024,512);eg.fillStyle='#aeb7c3';eg.fillRect(0,0,1024,160);eg.fillStyle='#f6f3e9';for(let x=30;x<1024;x+=170)eg.fillRect(x,90,105,34);eg.fillStyle='#22252b';eg.fillRect(0,300,1024,212);
 const env=new THREE.CanvasTexture(e);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.8;
 const hall=new THREE.Group();hall.name='competition-hall';scene.add(hall);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x30353d,roughness:.83,bumpMap:foam,bumpScale:.014}));ground.rotation.x=-Math.PI/2;ground.position.y=-.15;ground.receiveShadow=true;hall.add(ground);
 const wallMaterial=new THREE.MeshStandardMaterial({color:0x424b59,roughness:.86}),seatRed=new THREE.MeshStandardMaterial({color:0x842c3a,roughness:.84}),seatBlue=new THREE.MeshStandardMaterial({color:0x354b65,roughness:.84});
 for(const side of [-1,1]){
  box(hall,[.25,8,36],wallMaterial,[side*15,3.8,0]);box(hall,[30,8,.25],wallMaterial,[0,3.8,side*16]);
  for(let n=-12;n<=12;n+=6){box(hall,[.15,.24,30],dark,[n,7,0]);box(hall,[30,.24,.15],dark,[0,7,n]);}
  // Realistic barriers, tiered spectator seating, and neutral equipment cases.
  box(hall,[19,.08,.08],steel,[0,1.1,side*8]);
  for(let x=-9;x<=9;x+=3)box(hall,[.07,1.1,.07],steel,[x,.5,side*8]);
  for(let row=0;row<3;row++){box(hall,[21,.18,.8],dark,[0,.35+row*.38,side*(10+row)]);for(let seat=0;seat<24;seat++){const m=box(hall,[.62,.09,.55],seat%4===0?seatRed:seatBlue,[-9.5+seat*.82,.49+row*.38,side*(10+row)]);m.castShadow=false;}}
 }
 const luminous=new THREE.MeshBasicMaterial({color:0xf1f4ff});
 for(const x of [-5,5])for(const z of [-7,0,7]){box(hall,[3,.08,.65],dark,[x,6.8,z]);const panel=box(hall,[2.8,.025,.5],luminous,[x,6.74,z]);panel.castShadow=false;}
 // Wall tops, corner brackets and fasteners replace bare rectangular fences.
 for(const [x,z,sx,sz] of [[-6,0,.1,12],[6,0,.1,12],[0,-6,12,.1],[0,6,12,.1]])box(hall,[sx,.045,sz],steel,[x,.76,z]);
 const boltGeometry=new THREE.CylinderGeometry(.026,.026,.018,6),bolts=new THREE.InstancedMesh(boltGeometry,steel,80),matrix=new THREE.Matrix4(),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);let b=0;
 for(const side of [-1,1])for(let n=-5.7;n<6;n+=.6){matrix.compose(new THREE.Vector3(n,.57,side*5.95),q,new THREE.Vector3(1,1,1));bolts.setMatrixAt(b++,matrix);}
 bolts.count=b;hall.add(bolts);
 const template=new THREE.Group(),hardware=makeRobotMeshes(template);for(const {mesh,part} of hardware){const p=mesh.geometry.getAttribute('position'),uv=[];for(let i=0;i<p.count;i++)uv.push((p.getX(i)+p.getY(i))*.8,p.getZ(i)*.8);mesh.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(part.material==='metal')mesh.material=steel;else if(part.material==='rubber')mesh.material=rubber;}
 // Batch fixed chassis parts by material without discarding any hardware geometry.
 const batches=new Map();for(const {mesh,part} of hardware){if(part.wheel||part.core)continue;let batch=batches.get(mesh.material);if(!batch){batch={positions:[],normals:[],uvs:[]};batches.set(mesh.material,batch);}const p=mesh.geometry.getAttribute('position'),n=mesh.geometry.getAttribute('normal');for(let i=0;i<p.count;i++){batch.positions.push(p.getX(i)+mesh.position.x,p.getY(i)+mesh.position.y,p.getZ(i)+mesh.position.z);batch.normals.push(n.getX(i),n.getY(i),n.getZ(i));batch.uvs.push((p.getX(i)+p.getY(i)+mesh.position.x+mesh.position.y)*.8,(p.getZ(i)+mesh.position.z)*.8);}}
 const chassis=[];for(const [material,batch] of batches){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(batch.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(batch.normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(batch.uvs,2));const body=new THREE.Mesh(g,material);body.castShadow=true;body.receiveShadow=true;chassis.push(body);}

 const treadGeometry=new THREE.BoxGeometry(.36,.065,.10),treadMatrix=new THREE.Matrix4();
 function robot(r){
  const group=new THREE.Group();group.name='match-robot-'+r.id;group.scale.setScalar(.28);const pivots=new Map();for(const body of chassis)group.add(body.clone());
  for(const {mesh:m,part} of hardware){if(!part.wheel)continue;const clone=m.clone();if(part.wheel){const key=part.wheel.join(','),pivot=pivots.get(key)||new THREE.Group();if(!pivots.has(key)){pivot.position.fromArray(part.wheel);group.add(pivot);pivots.set(key,pivot);const tread=new THREE.InstancedMesh(treadGeometry,rubber,28);for(let n=0;n<28;n++){const a=n*Math.PI*2/28;treadMatrix.compose(new THREE.Vector3(0,Math.cos(a)*.565,Math.sin(a)*.565),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),a),new THREE.Vector3(1,1,1));tread.setMatrixAt(n,treadMatrix);}tread.castShadow=true;pivot.add(tread);}pivot.add(clone);clone.position.set(...part.p.map((v,i)=>v-part.wheel[i]));}else group.add(clone);}
  // Protective squad-coloured bumpers leave the photographed chassis visible.
  const bumper=new THREE.MeshStandardMaterial({color:r.squad==='red'?0x9e2439:0x1c528d,roughness:.86,bumpMap:foam,bumpScale:.006});
  for(const z of [-1.45,1.45])box(group,[2.6,.25,.17],bumper,[0,.52,z]);
  return {group,wheels:[...pivots.values()]};
 }
 return {foam,steel,rubber,wood,dark,robot};
}
