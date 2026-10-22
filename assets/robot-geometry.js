// Shared geometry for the WebGL and Canvas renderers. Y is up; +Z is the intake.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function offsetPart(part,separation){
  const amount=clamp(separation*1.5-part.g*.16);
  return part.p.map((v,i)=>v+(part.explode?.[i]||0)*amount);
}
export function projectPoint(point,{yaw,pitch,width,height,scale=1}){
  let [x,y,z]=point;
  const xx=x*Math.cos(yaw)+z*Math.sin(yaw);
  let zz=x*Math.sin(yaw)-z*Math.cos(yaw);
  y-=.78;
  const yy=y*Math.cos(pitch)+zz*Math.sin(pitch);
  zz=-y*Math.sin(pitch)+zz*Math.cos(pitch);
  const f=Math.min(width*1.15,height*1.8)*scale/(8+zz);
  return [width/2+xx*f,height*.52-yy*f,zz];
}
export function polygonsFor(parts,separation,view,spin=0){
  const polygons=[];
  for(const part of parts){
    const p=offsetPart(part,separation);
    const world=part.v.map(v=>{
      let q=v.map((v,i)=>v+p[i]);
      if(part.wheel){const center=part.wheel.map((v,i)=>v+p[i]-part.p[i]),y=q[1]-center[1],z=q[2]-center[2];q[1]=center[1]+y*Math.cos(spin)-z*Math.sin(spin);q[2]=center[2]+y*Math.sin(spin)+z*Math.cos(spin);}
      return q;
    });
    const verts=world.map(p=>projectPoint(p,view));
    const rgb=[1,3,5].map(k=>parseInt(part.c.slice(k,k+2),16));
    for(const face of part.f){
      const a=world[face[0]],b=world[face[1]],c=world[face[2]];
      const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);
      const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const length=Math.hypot(...n)||1;
      const light=.48+.58*Math.abs((n[0]*-.4+n[1]*.85+n[2]*.35)/length);
      const points=face.map(i=>verts[i]);
      polygons.push({points,z:points.reduce((s,p)=>s+p[2],0)/points.length,color:rgb.map(c=>Math.min(255,Math.round(c*light))),alpha:part.alpha??1,name:part.name});
    }
  }
  return polygons.sort((a,b)=>b.z-a.z);
}
