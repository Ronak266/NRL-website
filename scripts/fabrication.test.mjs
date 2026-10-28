import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const parts=JSON.parse(fs.readFileSync(new URL('../assets/robot.json',import.meta.url)));
test('printed carriage and jaw supports are distinct from metal hardware',()=>{
 const printed=parts.filter(p=>p.material==='printed');
 assert.ok(printed.length>=10,'expected actual printed components in the model');
 for(const p of printed){assert.equal(p.printLayerHeight,.006);assert.ok(!p.hardware);}
 for(const name of ['Lift carriage plate','Gripper shaft support','Left gripper finger','Right gripper finger'])assert.ok(printed.some(p=>p.name===name),name);
 for(const p of parts.filter(p=>p.hardware)){assert.equal(p.material,'metal');assert.match(p.detail,/helical thread/);}
 for(const p of parts.filter(p=>/drive pinion/.test(p.name)))assert.equal(p.material,'metal');
});
