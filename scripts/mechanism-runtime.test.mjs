import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
function setup(reduced=false){
 const html=read('index.html'),elements={};
 class Element{
  constructor(){this.value=0;this.dataset={};this.events={};this.attrs={};this.textContent='';}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  dispatchEvent(event){for(const fn of this.events[event.type]||[])fn(event);}
  setAttribute(k,v){this.attrs[k]=v;}
  getBoundingClientRect(){return {top:100,bottom:600};}
  fire(type){this.dispatchEvent({type});}
 }
 for(const id of ['lab-stage','gripper-position','lift-position','pickup-demo','mechanism-status','gripper-value','lift-value','separation','explode']){assert.ok(html.includes('id="'+id+'"'));elements[id]=new Element();}
 elements.separation.addEventListener('input',()=>elements['lab-stage'].dataset.separation=String(Number(elements.separation.value)/100));
 let frame,clock=100;
 const context={document:{hidden:false,body:{classList:{contains:()=>false}},querySelector:q=>elements[q.slice(1)]},innerHeight:900,Event:class{constructor(type){this.type=type}},matchMedia:()=>({matches:reduced}),requestAnimationFrame:fn=>frame=fn};
 vm.runInNewContext(read('assets/robot-geometry.js').replaceAll('export ','')+'\n'+read('assets/mechanism-runtime.js'),context);
 return {elements,advance(ms,step=20){for(let elapsed=0;elapsed<ms;elapsed+=step){clock+=step;frame?.(clock);}}};
}
test('pickup controls assemble first, grip before lifting and release only after lowering',()=>{
 const f=setup(),e=f.elements,h=e['lab-stage'];h.dataset.separation='.8';e['pickup-demo'].fire('click');assert.equal(h.dataset.separation,'0');
 f.advance(900);assert.equal(Number(h.dataset.lift),0);assert.equal(Number(h.dataset.grip),0);
 f.advance(1900);assert.equal(Number(h.dataset.grip),1);assert.ok(Number(h.dataset.lift)>0);
 f.advance(2300);assert.equal(Number(h.dataset.lift),1);assert.equal(Number(h.dataset.grip),1);
 f.advance(3800);assert.equal(Number(h.dataset.lift),0);assert.equal(Number(h.dataset.grip),0);assert.equal(e['pickup-demo'].attrs['aria-pressed'],'false');
});
test('manual controls prevent opening an elevated gripper and close before lifting',()=>{
 const {elements:e}=setup();e['gripper-position'].value=0;e['gripper-position'].fire('input');assert.equal(Number(e['lab-stage'].dataset.grip),0);
 e['lift-position'].value=100;e['lift-position'].fire('input');assert.equal(Number(e['lab-stage'].dataset.grip),1);assert.equal(Number(e['lab-stage'].dataset.lift),1);
 e['gripper-position'].value=0;e['gripper-position'].fire('input');assert.equal(Number(e['lab-stage'].dataset.grip),1);assert.match(e['mechanism-status'].textContent,/Lower the lift/);
});
test('reduced motion presents a static raised pose',()=>{
 const {elements:e}=setup(true);e['pickup-demo'].fire('click');assert.equal(Number(e['lab-stage'].dataset.lift),1);assert.equal(e['pickup-demo'].attrs['aria-pressed'],'false');
});
test('pickup completes at four frames per second in the software renderer',()=>{
 const f=setup(),e=f.elements;e['pickup-demo'].fire('click');f.advance(9250,250);
 assert.equal(e['pickup-demo'].attrs['aria-pressed'],'false');
 assert.equal(Number(e['lab-stage'].dataset.lift),0);
 assert.equal(Number(e['lab-stage'].dataset.grip),0);
});
