import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../assets/robot-geometry.js',import.meta.url),'utf8');
const geometry=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const parts=JSON.parse(fs.readFileSync(new URL('../assets/robot.json',import.meta.url)));
test('each complete wire disconnects on its own route',()=>{
 const wires=parts.filter(p=>p.system==='wiring');
 assert.ok(wires.length>=8,'expected at least eight individual wire routes');
 assert.equal(new Set(wires.map(p=>p.explode.join(','))).size,wires.length);
 for(const p of wires) assert.ok(p.v.length>=60,'wire must be a continuous curved mesh');
});
test('fitted exploded geometry stays inside the viewport at any orbit',()=>{
 assert.equal(typeof geometry.fitPolygons,'function');
 for(const width of [360,1280])for(const yaw of [0,.6,1.5,3.1]){
  const view={yaw,pitch:.6,width,height:560,distance:18};
  const polys=geometry.fitPolygons(geometry.polygonsFor(parts,1,view),width,560,24);
  for(const poly of polys)for(const [x,y,z] of poly.points){
   assert.ok(Number.isFinite(x+y+z));
   assert.ok(x>=23.9&&x<=width-23.9&&y>=23.9&&y<=536.1,`clipped part ${poly.name}`);
  }
 }
});
test('zero separation preserves every assembled position',()=>{
 for(const p of parts)assert.deepEqual(geometry.offsetPart(p,0),p.p);
});
test('camera fits the robot at wide and portrait aspect ratios without a distant sphere fit',()=>{
 for(const separation of [0,.5,1])for(const aspect of [.65,1,3.3])for(const yaw of [0,.55,Math.PI/2]){
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(const part of parts){const offset=geometry.offsetPart(part,separation);for(const vertex of part.v)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],vertex[i]+offset[i]);hi[i]=Math.max(hi[i],vertex[i]+offset[i]);}}
  const pitch=.55,t=Math.tan(34*Math.PI/360),distance=geometry.fitCameraDistance(lo,hi,{yaw,pitch,aspect}),center=lo.map((v,i)=>(v+hi[i])/2);
  let occupancy=0;
  for(const x of [lo[0],hi[0]])for(const y of [lo[1],hi[1]])for(const z of [lo[2],hi[2]]){
   const p=[x-center[0],y-center[1],z-center[2]],cx=p[0]*Math.cos(yaw)-p[2]*Math.sin(yaw),cy=-p[0]*Math.sin(yaw)*Math.sin(pitch)+p[1]*Math.cos(pitch)-p[2]*Math.cos(yaw)*Math.sin(pitch),depth=p[0]*Math.sin(yaw)*Math.cos(pitch)+p[1]*Math.sin(pitch)+p[2]*Math.cos(yaw)*Math.cos(pitch);
   const nx=Math.abs(cx)/((distance-depth)*t*aspect),ny=Math.abs(cy)/((distance-depth)*t);assert.ok(nx<1&&ny<1,'camera clips an assembly corner');occupancy=Math.max(occupancy,nx,ny);
  }
  assert.ok(occupancy>.65,'robot is unnecessarily distant');
 }
});
test('soldered controller components stay attached during the exploded view',()=>{
 const board=parts.find(p=>p.name==='Control board');
 for(const p of parts.filter(p=>/PCB integrated circuit|Controller connection header|Controller USB connector/.test(p.name))){
  assert.deepEqual(p.explode,board.explode);assert.equal(p.delay,board.delay);
 }
});
test('complete CORE mechanism contains two servos, opposing jaws and a guided lift',()=>{
 for(const name of ['Gripper servo housing','Lift servo housing','Gripper drive pinion','Lift drive pinion','Left gripper finger','Right gripper finger','Left gripper rack','Right gripper rack','Lift rack','Lift carriage plate'])assert.ok(parts.some(p=>p.name===name&&p.system==='mechanism'),name);
 assert.equal(parts.filter(p=>p.name==='Lift guide shaft').length,2);
});
test('gripper closes symmetrically and lifts the CORE only after gripping it',()=>{
 assert.equal(typeof geometry.mechanismPose,'function');
 const left=parts.find(p=>p.name==='Left gripper finger'),right=parts.find(p=>p.name==='Right gripper finger'),core=parts.find(p=>p.core);
 const open=p=>geometry.mechanismPose(p,0,{grip:0,lift:0}),closed=p=>geometry.mechanismPose(p,0,{grip:1,lift:0});
 assert.ok(closed(left).position[0]>open(left).position[0]);assert.ok(closed(right).position[0]<open(right).position[0]);
 assert.ok(Math.abs(closed(left).position[0]+closed(right).position[0])<1e-6);
 assert.equal(geometry.mechanismPose(core,0,{grip:0,lift:1}).position[1],core.p[1]);
 assert.ok(Math.abs(geometry.mechanismPose(core,0,{grip:1,lift:1}).position[1]-core.p[1]-.35)<1e-6);
 const gear=parts.find(p=>p.name==='Gripper drive pinion');assert.ok(Math.abs(closed(gear).rotation[1])>1);
 for(const p of parts)for(const separation of [0,.3,1]){
  const pose=geometry.mechanismPose(p,separation,{grip:1,lift:1});assert.ok(pose.position.concat(pose.rotation).every(Number.isFinite));
 }
});
