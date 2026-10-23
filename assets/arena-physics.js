// Small deterministic driving model for the interactive practice arena.
export const ringPositions=[[-7,-6],[0,-7],[7,-6],[7,1],[6,7],[-1,7],[-7,6],[-7,0]];
export function newDriveState(){return {x:0,z:0,yaw:0,speed:0,distance:0,travel:0,collected:[],elapsed:0};}
export function stepDrive(state,input,seconds){
 const dt=Math.max(0,Math.min(.05,seconds)),throttle=Math.max(-1,Math.min(1,input.throttle||0)),steer=Math.max(-1,Math.min(1,input.steer||0));
 const maxSpeed=input.boost?6:3.8;
 const speed=state.speed+(throttle*maxSpeed-state.speed)*(1-Math.exp(-dt*(throttle?3.5:5)));
 const yaw=state.yaw+steer*dt*1.7*(.35+Math.abs(speed)/maxSpeed);
 const nextX=state.x+Math.sin(yaw)*speed*dt,nextZ=state.z+Math.cos(yaw)*speed*dt;
 const x=Math.max(-9,Math.min(9,nextX)),z=Math.max(-9,Math.min(9,nextZ));
 const collided=x!==nextX||z!==nextZ;
 const collected=state.collected.slice();
 ringPositions.forEach(([rx,rz],i)=>{if(!collected.includes(i)&&Math.hypot(x-rx,z-rz)<1.15)collected.push(i);});
 return {x,z,yaw,speed:collided?0:speed,distance:state.distance+Math.hypot(x-state.x,z-state.z),travel:state.travel+Math.hypot(x-state.x,z-state.z)*Math.sign(speed),collected,elapsed:state.elapsed+dt};
}
