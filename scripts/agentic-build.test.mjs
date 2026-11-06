import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const runtime=fs.readFileSync(new URL('../assets/agentic-build.js',import.meta.url),'utf8');
function setup({reduced=false,mobile=false,hash=''}={}){
 const dom=new JSDOM(html,{url:'https://example.test/NRL-website/'+hash,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let time=0,y=0,next=0;const timers=new Map(),frames=new Map(),animations=[],intersections=[],media=new Map();
 Object.defineProperty(w,'innerWidth',{value:mobile?390:1360,configurable:true});Object.defineProperty(w,'innerHeight',{value:900});
 Object.defineProperty(w,'scrollY',{get:()=>y});Object.defineProperty(d.documentElement,'scrollHeight',{get:()=>19000});
 Object.defineProperty(w.performance,'now',{value:()=>time});
 w.matchMedia=q=>{if(!media.has(q))media.set(q,{matches:q.includes('reduced')?reduced:mobile,callbacks:[],addEventListener(_,fn){this.callbacks.push(fn)}});return media.get(q)};
 w.setTimeout=(fn,delay)=>{const id=++next;timers.set(id,{fn,at:time+delay});return id};w.clearTimeout=id=>timers.delete(id);
 w.requestAnimationFrame=fn=>{const id=++next;frames.set(id,fn);return id};w.cancelAnimationFrame=id=>frames.delete(id);
 w.scrollTo=options=>{y=options.top;w.dispatchEvent(new w.Event('scroll'))};
 w.IntersectionObserver=class{constructor(fn){this.callback=fn;this.targets=[];intersections.push(this)}observe(el){this.targets.push(el)}unobserve(){}disconnect(){}};
 w.Element.prototype.animate=function(keyframes,options){const a={target:this,keyframes,options,currentTime:0,cancelled:false,pause(){},cancel(){this.cancelled=true}};animations.push(a);return a;};
 for(const video of d.querySelectorAll('video'))video.pause=()=>{};
 // Exercise the actual six-profile directory and native profile dialogs.
 const inline=[...d.querySelectorAll('script:not([src])')].find(s=>s.textContent.includes('const members='));
 w.eval(inline.textContent.split('// A continuous scroll timeline')[0]);
 const sections=[...d.querySelectorAll('main>section')];
 for(const el of d.querySelectorAll('*')){
  const section=el.closest('main>section'),index=sections.indexOf(section),rank=section?[...section.querySelectorAll('*')].indexOf(el):0;
  let top=index<0?0:index*1300+Math.max(rank,0)*7+110;
  if(el.tagName==='HEADER')top=0;
  const height=el.tagName==='HEADER'?76:el.matches('.card,.intro-video-card,#lab-stage,#drive-stage')?320:el.matches('h1,h2')?110:65;
  Object.defineProperty(el,'offsetTop',{get:()=>top});Object.defineProperty(el,'offsetHeight',{get:()=>height});
  el.getBoundingClientRect=()=>({x:40,y:top-y,left:40,top:top-y,right:Math.min(w.innerWidth-30,680),bottom:top-y+height,width:Math.min(w.innerWidth-70,640),height});
  el.getClientRects=()=>[el.getBoundingClientRect()];
 }
 d.querySelector('#drive-start').setAttribute('aria-pressed','false');d.querySelector('#drive-demo').setAttribute('aria-pressed','false');
 d.querySelector('#drive-start').addEventListener('click',()=>{const b=d.querySelector('#drive-start');b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'))});
 w.eval(runtime);
 const get=s=>d.querySelector(s),click=s=>get(s).click();
 function tick(count=1){for(let i=0;i<count;i++){time+=40;for(const [id,timer] of timers)if(timer.at<=time){timers.delete(id);timer.fn();}const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(time)}}
 return{w,d,animations,get,click,tick,frames,media,intersections,scroll(value){y=value;w.dispatchEvent(new w.Event('scroll'))},close:()=>dom.window.close()};
}
test('actual content retains six profiles, four controlled introductions, mentor, and rules before gameplay',()=>{
 const f=setup({reduced:true});assert.equal(f.d.querySelectorAll('#cards .card').length,6);assert.equal(f.d.querySelectorAll('.team-intro-video[controls]').length,4);
 assert.match(f.get('#mentor').textContent,/Neelima Valiveti/);assert.equal(f.get('#forge-overlay').getAttribute('inert'),'');
 assert(f.get('#hyperdrive-rules').compareDocumentPosition(f.get('#drive-stage'))&4);assert(f.get('#assembly').compareDocumentPosition(f.get('#arena'))&4);
 assert.equal(f.get('#follow .btn').href,'https://www.instagram.com/titanforge_nrl_187/');f.close();
});
test('opening builds navigation and real hero elements; finishes with no temporary outlines or hidden content',()=>{
 const f=setup();f.tick(250);assert(f.animations.some(a=>a.target.tagName==='HEADER'));assert(f.animations.some(a=>a.target.matches('.hero h1')));
 assert.equal(f.d.querySelectorAll('.forge-pending').length,0);assert(f.animations.every(a=>a.cancelled));
 assert([...f.d.querySelectorAll('.forge-selection')].every(el=>el.style.opacity==='0'));f.close();
});
test('guided showcase can pause every clock and resume, and Replay restarts from the hero',()=>{
 const f=setup();f.click('.hero [data-forge-watch]');f.tick(10);assert.equal(f.d.body.dataset.forgeMode,'showcase');
 f.click('#forge-pause');const y=f.w.scrollY,times=f.animations.map(a=>a.currentTime);f.tick(50);
 assert.equal(f.d.body.dataset.forgeMode,'paused');assert.equal(f.w.scrollY,y);assert.deepEqual(f.animations.map(a=>a.currentTime),times);
 f.click('#forge-pause');f.tick(100);assert.equal(f.d.body.dataset.forgeMode,'showcase');f.click('#forge-replay');f.tick(20);assert(f.w.scrollY<120);f.close();
});
test('wheel, touch, keyboard, scrollbar scrolling and navigation immediately interrupt guided movement',()=>{
 for(const kind of ['wheel','touchmove','keydown','scroll','navigation']){
  const f=setup();f.click('.hero [data-forge-watch]');f.tick(12);
  if(kind==='scroll')f.scroll(500);else if(kind==='navigation')f.click('header a[href="#assembly"]');else f.w.dispatchEvent(kind==='keydown'?new f.w.KeyboardEvent('keydown',{key:'PageDown'}):new f.w.Event(kind));
  assert.equal(f.d.body.dataset.forgeMode,'explore',kind);const y=f.w.scrollY;f.tick(100);assert.equal(f.w.scrollY,y,kind+' must not snap back');
  assert.equal(f.d.querySelectorAll('.forge-pending').length,0);f.close();
 }
});
test('Explore releases every animation immediately without changing content or media controls',()=>{
 const f=setup();f.click('.hero [data-forge-watch]');f.tick(25);f.click('#forge-explore');assert.equal(f.d.body.dataset.forgeMode,'explore');
 assert(f.animations.every(a=>a.cancelled));assert(f.get('.team-intro-video').controls);assert.equal(f.d.querySelectorAll('.forge-pending').length,0);f.close();
});
test('showcase reaches all seven chapters and returns a completely usable website',()=>{
 const f=setup();f.click('.hero [data-forge-watch]');f.tick(6000);
 assert.equal(f.d.body.dataset.forgeMode,'explore');assert.match(f.get('#forge-status').textContent,/BUILD COMPLETE/);
 for(let chapter=1;chapter<=7;chapter++)assert(f.d.querySelector('[data-forge-chapter="'+chapter+'"][data-forge-built="true"]'),'chapter '+chapter);
 assert(f.animations.every(a=>a.cancelled));f.close();
});
test('game activation cancels a showcase and removes decorative activity without consuming driving keys',async()=>{
 const f=setup();f.click('.hero [data-forge-watch]');f.tick(30);f.scroll(f.get('.arena-shell').offsetTop-100);f.click('#drive-start');await Promise.resolve();
 assert.equal(f.d.body.dataset.forgeMode,'explore');assert(f.d.body.classList.contains('forge-playing'));
 const key=new f.w.KeyboardEvent('keydown',{key:'w',bubbles:true,cancelable:true});f.get('#drive-stage').dispatchEvent(key);assert.equal(key.defaultPrevented,false);
 assert(f.animations.every(a=>a.cancelled));f.close();
});
test('reduced motion never animates or auto-scrolls; changing that preference releases an active showcase',()=>{
 const f=setup({reduced:true});f.click('.hero [data-forge-watch]');f.tick(200);assert.equal(f.animations.length,0);assert.equal(f.w.scrollY,0);assert.equal(f.d.querySelectorAll('.forge-pending').length,0);f.close();
 const g=setup();g.click('.hero [data-forge-watch]');g.tick(15);const pref=g.media.get('(prefers-reduced-motion: reduce)');pref.matches=true;pref.callbacks.forEach(fn=>fn());assert.equal(g.d.body.dataset.forgeMode,'explore');assert(g.animations.every(a=>a.cancelled));g.close();
});
test('mobile uses two smaller cursor lanes and resizing releases work before measuring a new layout',()=>{
 const f=setup({mobile:true});assert.equal(f.d.querySelectorAll('.forge-agent').length,2);f.click('.hero [data-forge-watch]');f.tick(20);f.w.dispatchEvent(new f.w.Event('resize'));
 assert.equal(f.d.body.dataset.forgeMode,'explore');assert(f.animations.every(a=>a.cancelled));assert.equal(f.d.querySelectorAll('.forge-pending').length,0);f.close();
});

test('settling after a showcase interruption still builds the newly visible section',()=>{
 const f=setup();f.click('.hero [data-forge-watch]');f.tick(15);f.w.dispatchEvent(new f.w.Event('wheel'));f.scroll(f.get('#team-intro-title').offsetTop-120);f.tick(200);
 assert.equal(f.get('#team-intro-title').dataset.forgeBuilt,'true');assert.equal(f.d.body.dataset.forgeMode,'explore');f.close();
});
test('Replay restores all six profiles and opens the playbook after visitors change browsing state',()=>{
 const f=setup({hash:'#team'});f.click('[data-folder=mentor]');f.get('#hyperdrive-rules').open=false;assert.equal(f.d.querySelectorAll('#cards .card').length,1);
 f.click('#forge-replay');assert.equal(f.d.querySelectorAll('#cards .card').length,6);assert(f.get('#hyperdrive-rules').open);f.tick(6000);assert.match(f.get('#forge-status').textContent,/BUILD COMPLETE/);f.close();
});
