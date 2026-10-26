// Deterministic training rules, in feet. Geometry and mechanisms are illustrative.
export const HYPERDRIVE_RULES=Object.freeze({duration:150,levelUp:120,controlLimit:2,sourceCapacity:6,highCapacity:4,starCapacity:3,apexCapacity:6,normalStarburst:10,payloadStarburst:4,coreHigh:3,coreStar:5,coreApex:9,coreDrop:1,goldStar:7,goldDrop:3,starBonus:10,payloadBonus:10,engage:3,dock:8,balance:15});
export const HYPERDRIVE_FIELD={size:12,robotRadius:.48,source:{red:{x:-4.85,z:4.85,half:1.083},blue:{x:4.85,z:-4.85,half:1.083}},drop:{red:{x:-4.85,z:-4.85,half:1.04},blue:{x:4.85,z:4.85,half:1.04}},vault:{red:{x:-3.5,z:5.25,half:.55},blue:{x:3.5,z:-5.25,half:.55}},station:{red:{x:-4.85,z:0,hx:.9,hz:2.35},blue:{x:4.85,z:0,hx:.9,hz:2.35}}};
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
const opposite=squad=>squad==='red'?'blue':'red';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const inZone=(robot,zone,margin=0)=>Math.abs(robot.x-zone.x)<=zone.half-margin&&Math.abs(robot.z-zone.z)<=zone.half-margin;
const copyMatch=state=>JSON.parse(JSON.stringify(state));
export function driveInput(held){return {throttle:(held.has('forward')?1:0)-(held.has('back')?1:0),steer:(held.has('right')?1:0)-(held.has('left')?1:0),precision:held.has('precision'),brake:held.has('brake')};}
export function newDriveState(){return {x:0,z:-5.35,yaw:0,speed:0,angular:0,distance:0,travel:0};}
export function stepDrive(state,input,seconds){
 const dt=limit(seconds,0,.05),throttle=limit(input.throttle||0,-1,1),steer=limit(input.steer||0,-1,1),maxSpeed=input.precision?1.15:3.1;
 const speed=input.brake?state.speed*Math.exp(-dt*17):state.speed+(throttle*maxSpeed-state.speed)*(1-Math.exp(-dt*(throttle?3.2:5.4)));
 // +Z is the intake. A positive right-steer must DECREASE yaw, including while reversing.
 const angular=(state.angular||0)+(-steer*(input.precision?1.05:1.8)-(state.angular||0))*(1-Math.exp(-dt*7));
 const yaw=state.yaw+angular*dt,x=limit(state.x+Math.sin(yaw)*speed*dt,-5.49,5.49),z=limit(state.z+Math.cos(yaw)*speed*dt,-5.49,5.49);
 const travel=Math.hypot(x-state.x,z-state.z);
 const wall=Math.abs(x)>=5.49||Math.abs(z)>=5.49;
 return {...state,x,z,yaw,speed:wall?0:speed,angular,distance:state.distance+travel,travel:state.travel+travel*Math.sign(speed)};
}
function poleLayout(){const poles=[];for(const squad of ['red','blue']){const side=squad==='red'?-1:1;for(let i=0;i<3;i++)poles.push({id:squad+'-high-'+i,squad,kind:'high',x:(i-1)*2,z:side*2,stack:[]});for(let i=0;i<2;i++){poles.push({id:squad+'-star-'+i,squad,kind:'star',x:i?2:-2,z:-side*1.3,stack:[]});poles.push({id:squad+'-apex-'+i,squad,kind:'apex',x:HYPERDRIVE_FIELD.station[squad].x,z:i?.85:-.85,stack:[]});}}return poles;}
export function newHyperdriveMatch(seed=0){
 const robots=[['187','red',-.9,-5.35,0],['R2','red',.9,-5.35,0],['B1','blue',-.9,5.35,Math.PI],['B2','blue',.9,5.35,Math.PI]].map(([id,squad,x,z,yaw])=>({...newDriveState(),id,squad,x,z,yaw,inventory:[],payload:null,balanceTime:0,nextAI:0,path:[],planKey:'',nextPath:0}));
 const cores=[];for(const squad of ['red','blue']){const sign=squad==='red'?1:-1;for(let i=0;i<3;i++)cores.push({id:squad+'-field-'+i,squad,kind:squad,x:(i-1)*2,z:sign*.25,location:'floor'});for(let i=0;i<6;i++)cores.push({id:squad+'-gold-'+i,squad,kind:'gold',x:HYPERDRIVE_FIELD.vault[squad].x,z:HYPERDRIVE_FIELD.vault[squad].z,location:'vault'});}
 const goldIndex=Math.abs(seed)%3,pattern=['gold','gold','gold'];pattern[goldIndex]='core';
 return {status:'ready',elapsed:0,seed,pattern,robots,cores,poles:poleLayout(),payloads:robots.map(r=>({id:'payload-'+r.id,team:r.id,squad:r.squad,location:'source'})),source:{red:20,blue:20},squads:{red:{starburst:false},blue:{starburst:false}},message:'Start the match. You drive Red 187; three training bots complete the two squads.',feedback:0};
}
export function startHyperdriveMatch(state){if(state.status==='finished')return state;const s=copyMatch(state);s.status='running';stageSources(s);return s;}
function stageSources(s){for(const squad of ['red','blue']){
 if(s.robots.some(r=>r.squad===squad&&inZone(r,HYPERDRIVE_FIELD.source[squad],-HYPERDRIVE_FIELD.robotRadius)))continue;
 let staged=s.cores.filter(c=>c.squad===squad&&c.location==='source').length;
 while(staged<3&&s.source[squad]>0){const n=20-s.source[squad],zone=HYPERDRIVE_FIELD.source[squad];s.cores.push({id:squad+'-source-'+n,squad,kind:squad,x:zone.x+(staged%2? .25:-.25),z:zone.z+(staged===2?.3:-.2),location:'source'});s.source[squad]--;staged++;}
}}
export function scoredColoredCores(s,squad){return s.cores.filter(c=>c.squad===squad&&c.kind!=='gold'&&(c.location==='pole'||c.location==='drop')).length;}
export function deliveredPayloads(s,squad){return s.payloads.filter(p=>p.squad===squad&&p.location==='drop').length;}
export function isStarMapComplete(s,pole){return pole.kind==='star'&&pole.stack.length===3&&pole.stack.every((id,i)=>{const core=s.cores.find(c=>c.id===id);return core.kind===(s.pattern[i]==='core'?pole.squad:'gold');});}
export function stationStatus(s,r){
 if(s.elapsed<HYPERDRIVE_RULES.levelUp)return 'none';const p=HYPERDRIVE_FIELD.station[r.squad],dx=Math.abs(r.x-p.x),dz=Math.abs(r.z-p.z);
 if(dx<p.hx-.39&&dz<p.hz-.42)return r.balanceTime>=1.5?'balance':'dock';
 if(dx<p.hx+.38&&dz<p.hz+.38)return 'engage';return 'none';
}
export function matchScore(s){
 const result={red:{core:0,star:0,payload:0,station:0,total:0},blue:{core:0,star:0,payload:0,station:0,total:0}};
 for(const c of s.cores){if(c.location==='drop')result[c.squad].core+=c.kind==='gold'?3:1;else if(c.location==='pole'){const p=s.poles.find(p=>p.id===c.pole);result[c.squad].core+=p.kind==='high'?3:p.kind==='apex'?9:c.kind==='gold'?7:5;}}
 for(const p of s.poles)if(isStarMapComplete(s,p))result[p.squad].star+=10;
 for(const squad of ['red','blue'])if(deliveredPayloads(s,squad)===2)result[squad].payload=10;
 for(const r of s.robots){const status=stationStatus(s,r);result[r.squad].station+=status==='balance'?15:status==='dock'?8:status==='engage'?3:0;}
 for(const squad of ['red','blue'])result[squad].total=result[squad].core+result[squad].star+result[squad].payload+result[squad].station;
 return result;
}
function tell(s,r,text){if(r.id==='187'){s.message=text;s.feedback++;}}
function facing(r,target){const angle=Math.atan2(target.x-r.x,target.z-r.z)-r.yaw;return Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<1.25;}
export function legalControlCount(s,r){return r.inventory.length+(r.payload?1:0);}
function act(s,r,action){
 if(s.status!=='running'){tell(s,r,'Start or reset the match before handling game pieces.');return;}
 const zone=HYPERDRIVE_FIELD.drop[r.squad];
 if(action==='starburst'){
  const squad=s.squads[r.squad];if(squad.starburst){tell(s,r,'Your VAULT is already unlocked.');return;}
  if(deliveredPayloads(s,r.squad)>0&&scoredColoredCores(s,r.squad)>=4){squad.starburst=true;tell(s,r,'Human Player activated early STARBURST. Your Golden CORE vault is open.');}
  else tell(s,r,'Early STARBURST requires a delivered PAYLOAD and at least 4 scored squad CORE. Normal activation is automatic at 10.');return;
 }
 if(action==='cycle'){if(r.inventory.length>1)r.inventory.push(r.inventory.shift());tell(s,r,'First CORE selected: '+(r.inventory.length?s.cores.find(c=>c.id===r.inventory[0]).kind.toUpperCase():'none'));return;}
 if(Math.abs(r.speed)>.65){tell(s,r,'Slow down or hold Space to brake before operating a mechanism.');return;}
 if(action==='cargo'){
  if(r.payload){if(!inZone(r,zone,.3)){tell(s,r,'Keep the PAYLOAD off the floor. Drive fully into your DROP ZONE before using the separate Cargo Bay.');return;}const p=s.payloads.find(p=>p.id===r.payload);p.location='drop';r.payload=null;tell(s,r,'Team PAYLOAD delivered. One payload unlocks the early 4-CORE STARBURST route; both squad payloads earn +10.');}
  else if(inZone(r,HYPERDRIVE_FIELD.source[r.squad],.2)){
   if(legalControlCount(s,r)>=2){tell(s,r,'Control limit reached: free a slot before loading PAYLOAD.');return;}
   const p=s.payloads.find(p=>p.team===r.id&&p.location==='source');if(!p){tell(s,r,'Your team PAYLOAD has already been delivered.');return;}p.location='held';r.payload=p.id;tell(s,r,'Your numbered PAYLOAD is secured in the separate Cargo Bay. Take it to your DROP ZONE.');
  }else tell(s,r,'Cargo Bay: load your own numbered PAYLOAD in your SOURCE ZONE, then deliver to your DROP ZONE.');return;
 }
 if(action!=='core')return;
 const first=s.cores.find(c=>c.id===r.inventory[0]);
 if(first&&inZone(r,zone,.3)){first.location='drop';first.x=r.x;first.z=r.z;r.inventory.shift();tell(s,r,(first.kind==='gold'?'Golden CORE +3':'Squad CORE +1')+' in your DROP ZONE.');}
 else {
  const targets=s.poles.filter(p=>p.squad===r.squad&&(p.kind==='apex'?stationStatus(s,r)==='dock'||stationStatus(s,r)==='balance':distance(r,p)<1.12&&facing(r,p))).sort((a,b)=>distance(r,a)-distance(r,b));
  if(first&&targets.length){const p=targets[0],capacity={high:4,star:3,apex:6}[p.kind];
   if(p.stack.length>=capacity){tell(s,r,p.kind.toUpperCase()+' POLE is full. Choose another pole or your Drop Zone.');return;}
   if(first.kind==='gold'&&p.kind!=='star'){tell(s,r,'Golden CORE may score only on a STAR POLE or in your DROP ZONE. Press R to change the selected CORE.');return;}
   if(p.kind==='apex'&&s.elapsed<120){tell(s,r,'APEX scoring opens only in the final 30 seconds, from your Space Station.');return;}
   p.stack.push(first.id);first.location='pole';first.pole=p.id;first.x=p.x;first.z=p.z;r.inventory.shift();tell(s,r,p.kind.toUpperCase()+' POLE scored'+(isStarMapComplete(s,p)?' · STAR MAP COMPLETE +10':'')+'.');
  }else{
   if(legalControlCount(s,r)>=2&&!inZone(r,zone)){tell(s,r,'Two-element control limit. Score or deliver before picking up more.');return;}
   const available=s.cores.filter(c=>c.squad===r.squad&&['floor','source','vault'].includes(c.location)&&distance(r,c)<.95&&facing(r,c)).sort((a,b)=>distance(r,a)-distance(r,b));
   const core=available[0];if(!core){tell(s,r,first?'Face an available pole, enter your Drop Zone, or collect a second CORE.':'Face a squad CORE or visit your SOURCE ZONE. E picks up; E at a scoring target places it.');return;}
   if(core.kind==='gold'&&!s.squads[r.squad].starburst){tell(s,r,'VAULT LOCKED. Activate STARBURST before retrieving Golden CORE.');return;}
   core.location='held';core.robot=r.id;r.inventory.push(core.id);tell(s,r,core.kind.toUpperCase()+' CORE secured. Choose a legal scoring target.');
  }
 }
 for(const squad of ['red','blue'])if(scoredColoredCores(s,squad)>=10)s.squads[squad].starburst=true;
}
export function applyHyperdriveAction(state,robotId,action){const s=copyMatch(state),r=s.robots.find(r=>r.id===robotId);if(r)act(s,r,action);return s;}
function staticBlocked(s,r,x,z,nav=false){
 const radius=nav?.53:.47,enemy=opposite(r.squad);
 for(const squad of ['red','blue']){const p=HYPERDRIVE_FIELD.station[squad],dx=Math.abs(x-p.x),dz=Math.abs(z-p.z);if(squad!==r.squad||s.elapsed<120){if(dx<p.hx+radius&&dz<p.hz+radius)return true;}else if(dx>p.hx-radius-.06&&dx<p.hx+radius+.06&&dz<1.55+radius)return true;}
 for(const key of ['source','vault']){const p=HYPERDRIVE_FIELD[key][enemy];if(Math.abs(x-p.x)<p.half+radius&&Math.abs(z-p.z)<p.half+radius)return true;}
 for(const p of s.poles)if(p.kind!=='apex'&&Math.hypot(x-p.x,z-p.z)<radius+.12)return true;
 return false;
}
function nextWaypoint(s,r,goal){
 const grid=.45,n=25,toCell=v=>limit(Math.round((v+5.4)/grid),0,n-1),start=[toCell(r.x),toCell(r.z)],end=[toCell(goal.x),toCell(goal.z)],key=(x,z)=>z*n+x;
 const open=[{x:start[0],z:start[1],g:0,f:0}],previous=new Map(),cost=new Map([[key(...start),0]]);let found=null;
 for(let count=0;open.length&&count<900;count++){
  open.sort((a,b)=>a.f-b.f);const a=open.shift(),ak=key(a.x,a.z);
  if(a.x===end[0]&&a.z===end[1]){found=ak;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const x=a.x+dx,z=a.z+dz;if(x<0||z<0||x>=n||z>=n)continue;const wx=x*grid-5.4,wz=z*grid-5.4;if(staticBlocked(s,r,wx,wz,true))continue;if(dx&&dz&&(staticBlocked(s,r,a.x*grid-5.4,wz,true)||staticBlocked(s,r,wx,a.z*grid-5.4,true)))continue;const k=key(x,z),g=a.g+Math.hypot(dx,dz);if(g>=(cost.get(k)??Infinity))continue;cost.set(k,g);previous.set(k,ak);open.push({x,z,g,f:g+Math.hypot(end[0]-x,end[1]-z)});}
 }
 if(found===null)return [goal];const path=[];for(let k=found;k!==key(...start)&&previous.has(k);k=previous.get(k))path.unshift({x:(k%n)*grid-5.4,z:Math.floor(k/n)*grid-5.4});path.push(goal);return path;
}
function botGoal(s,r){
 const source=HYPERDRIVE_FIELD.source[r.squad],drop=HYPERDRIVE_FIELD.drop[r.squad];
 if(r.payload)return {...drop,action:'cargo',key:'deliver'};
 if(s.elapsed>=120){const p=HYPERDRIVE_FIELD.station[r.squad];return {x:p.x,z:(r.id==='187'||r.id==='B1')?-.62:.62,action:r.inventory.length?'core':null,key:'station'};}
 if(s.payloads.some(p=>p.team===r.id&&p.location==='source')&&!r.inventory.length)return {...source,action:'cargo',key:'payload'};
 const starburst=s.squads[r.squad].starburst;
 const peers=s.robots.filter(other=>other.id!==r.id),reserved=key=>peers.some(other=>other.planKey===key);
 const stars=s.poles.filter(p=>p.squad===r.squad&&p.kind==='star'&&p.stack.length<3),star=stars.sort((a,b)=>(reserved(a.id)?100:0)+distance(r,a)-(reserved(b.id)?100:0)-distance(r,b))[0];
 const core=s.cores.find(c=>c.id===r.inventory[0]);
 if(core){let target;if(starburst&&star&&core.kind===(s.pattern[star.stack.length]==='core'?r.squad:'gold'))target=star;else if(core.kind!=='gold')target=s.poles.filter(p=>p.squad===r.squad&&p.kind==='high'&&p.stack.length<4).sort((a,b)=>(reserved(a.id)?100:0)+distance(r,a)-(reserved(b.id)?100:0)-distance(r,b))[0];if(!target)return {...drop,action:'core',key:'drop'};return {x:target.x,z:target.z+(target.z<0?-.86:.86),face:target,action:'core',key:target.id};}
 const kind=starburst&&star?(s.pattern[star.stack.length]==='core'?r.squad:'gold'):r.squad;
 const available=s.cores.filter(c=>c.squad===r.squad&&c.kind===kind&&['floor','source',...(starburst?['vault']:[])].includes(c.location)).sort((a,b)=>(reserved(a.id)?100:0)+distance(r,a)-(reserved(b.id)?100:0)-distance(r,b));
 if(available[0])return {...available[0],action:'core',key:available[0].id};
 return {...source,action:null,key:'wait-source'};
}
function botInput(s,r,dt){
 if(!s.squads[r.squad].starburst&&deliveredPayloads(s,r.squad)>0&&scoredColoredCores(s,r.squad)>=4)act(s,r,'starburst');
 const goal=botGoal(s,r),near=distance(r,goal)<.22;
 if(goal.key!==r.planKey||s.elapsed>r.nextPath){r.path=nextWaypoint(s,r,goal);r.planKey=goal.key;r.nextPath=s.elapsed+1.2;}
 while(r.path.length>1&&distance(r,r.path[0])<.38)r.path.shift();
 const target=near?(goal.face||goal):(r.path[0]||goal),angle=Math.atan2(target.x-r.x,target.z-r.z)-r.yaw,error=Math.atan2(Math.sin(angle),Math.cos(angle));
 if(near&&goal.action&&s.elapsed>r.nextAI&&Math.abs(error)<.9&&Math.abs(r.speed)<.65){act(s,r,goal.action);r.nextAI=s.elapsed+.6;}
 const input={throttle:near?0:Math.abs(error)>1.1?.12:.72,steer:limit(-error*1.6,-1,1),precision:false,brake:near};
 // Yield rather than repeatedly ramming another robot.
 if(s.robots.some(other=>other.id!==r.id&&distance(r,other)<.95&&facing(r,other))){input.throttle=-.18;input.steer=r.id==='R2'||r.id==='B2'?-.8:.8;}
 return input;
}
export function stepHyperdriveMatch(state,playerInput,seconds,{demo=false}={}){
 if(state.status!=='running')return state;const s=copyMatch(state),dt=Math.min(limit(seconds,0,.05),150-s.elapsed);s.elapsed+=dt;
 stageSources(s);
 for(let i=0;i<s.robots.length;i++){const r=s.robots[i],input=r.id==='187'&&!demo?playerInput:botInput(s,r,dt),next=stepDrive(r,{...input,precision:input.precision||(s.elapsed>=120&&Math.abs(r.x-HYPERDRIVE_FIELD.station[r.squad].x)<1.1&&Math.abs(r.z)<3.1)},dt);
  const blocked=(x,z)=>staticBlocked(s,r,x,z)||s.robots.some(other=>other.id!==r.id&&Math.hypot(x-other.x,z-other.z)<.87);
  if(blocked(next.x,next.z)){if(!blocked(next.x,r.z)){next.z=r.z;}else if(!blocked(r.x,next.z)){next.x=r.x;}else{next.x=r.x;next.z=r.z;}next.speed=0;next.travel=r.travel;next.distance=r.distance;}
  Object.assign(r,next);
 }
 for(const squad of ['red','blue']){const p=HYPERDRIVE_FIELD.station[squad],supported=s.robots.filter(r=>r.squad===squad&&Math.abs(r.x-p.x)<p.hx-.39&&Math.abs(r.z)<p.hz-.42),level=supported.length&&Math.abs(supported.reduce((sum,r)=>sum+r.z,0)/supported.length)<.22&&supported.every(r=>Math.abs(r.speed)<.25);
  for(const r of s.robots.filter(r=>r.squad===squad))r.balanceTime=s.elapsed>=120&&supported.includes(r)&&level?r.balanceTime+dt:0;
 }
 if(s.elapsed>=150-1e-8){s.elapsed=150;s.status='finished';for(const r of s.robots){r.speed=0;r.angular=0;}const score=matchScore(s);s.message='MATCH COMPLETE · '+(score.red.total===score.blue.total?'TIE':score.red.total>score.blue.total?'RED SQUAD WINS':'BLUE SQUAD WINS')+' · Reset to play again.';s.feedback++;}
 return s;
}
