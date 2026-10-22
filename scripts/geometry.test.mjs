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
