"""Photo-referenced Hyperdrive chassis. Units are relative, not measured CAD."""
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parts=[]
def part(name,p,v,f,c,g=0,alpha=1,explode=None,**extra):
 parts.append(dict(name=name,p=p,v=v,f=f,c=c,g=g,alpha=alpha,explode=explode or [0,.7+g*.3,0],**extra))
def box(name,p,s,c,g=0,alpha=1,angle=0,explode=None,rx=0,**extra):
 v=[]
 for z in [-1,1]:
  for y in [-1,1]:
   for x in [-1,1]:
    xx=x*s[0]/2; yy=y*s[1]/2
    vx=xx*math.cos(angle)-yy*math.sin(angle);vy=xx*math.sin(angle)+yy*math.cos(angle);vz=z*s[2]/2
    v.append([vx,vy*math.cos(rx)-vz*math.sin(rx),vy*math.sin(rx)+vz*math.cos(rx)])
 part(name,p,v,[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]],c,g,alpha,explode,**extra)
def cyl(name,p,r,length,c,g=1,axis='x',n=20,explode=None,**extra):
 v=[]
 for end in [-1,1]:
  for i in range(n):
   a=i*math.tau/n;xy=[r*math.cos(a),end*length/2,r*math.sin(a)]
   if axis=='x':xy=[xy[1],xy[0],xy[2]]
   if axis=='z':xy=[xy[0],xy[2],xy[1]]
   v.append(xy)
 f=[list(range(n-1,-1,-1)),list(range(n,n*2))]
 f.extend([[i,(i+1)%n,(i+1)%n+n,i+n] for i in range(n)])
 part(name,p,v,f,c,g,explode=explode,**extra)
def ring():
 n=40;profile=[(.315,-.15),(.435,-.15),(.475,-.11),(.475,.11),(.435,.15),(.315,.15),(.275,.11),(.275,-.11)]
 v=[[r*math.cos(i*math.tau/n),y,r*math.sin(i*math.tau/n)] for i in range(n) for r,y in profile]
 f=[[i*8+j,((i+1)%n)*8+j,((i+1)%n)*8+(j+1)%8,i*8+(j+1)%8] for i in range(n) for j in range(8)]
 part('Yellow CORE held at front',[0,.81,2.02],v,f,'#eec54e',2,explode=[0,.75,1.1],core=True)
# Low, open rectangular chassis, clear acrylic sides, silver channel frame.
box('Clear lower chassis deck',[0,.51,0],[2.65,.07,3.25],'#afc9d1',0,.23,explode=[0,-.12,0])
for x in [-1.3,1.3]:
 side=1 if x>0 else -1
 box('Acrylic side plate',[x,.94,0],[.055,.8,3.26],'#bbd8df',0,.18,explode=[side*.75,.12,0])
 for z in [-1.57,1.57]:
  box('Side plate upright',[x,.94,z],[.055,.83,.055],'#bac4c7',0,explode=[side*.6,.12,0])
 for y in [.58,1.32]:
  box('Longitudinal aluminium channel',[x,y,0],[.075,.065,3.26],'#a9b3b8',0,explode=[side*.55,0,0])
 for z in [-1.4,-1,-.6,-.2,.2,.6,1,1.4]:
  cyl('Chassis mounting fastener',[x+side*.04,1.16,z],.025,.018,'#616b70',0,n=8,explode=[side*.75,.12,0])
for z in [-1.57,-.55,.65,1.57]:
 box('Cross chassis support',[0,.65,z],[2.55,.08,.08],'#bdc5c7',0,explode=[0,-.2,z*.25])
box('Clear rear wall',[0,1.02,-1.62],[2.65,.72,.055],'#bbd8df',0,.2,explode=[0,.3,-.55])
# Four conventional rubber traction wheels, not mecanum or omni rollers.
for x in [-1.57,1.57]:
 side=1 if x>0 else -1
 for z in [-1.06,1.06]:
  center=[x,.56,z];exp=[side*.9,0,z*.25]
  cyl('Rubber traction wheel',center,.54,.39,'#202427',1,explode=exp,wheel=center)
  for i in range(16):
   a=i*math.tau/16
   box('Tyre tread lug',[x,.56+.535*math.cos(a),z+.535*math.sin(a)],[.415,.075,.15],'#303538',1,explode=exp,wheel=center,rx=a)
  cyl('Silver wheel hub',[x+side*.205,.56,z],.29,.035,'#bcc2c3',1,explode=exp,wheel=center)
  cyl('Hub center',[x+side*.23,.56,z],.095,.05,'#747f84',1,n=12,explode=exp,wheel=center)
  cyl('DC drive motor',[side*.95,.56,z],.17,.53,'#aab0b4',1,explode=[side*.45,.15,z*.25])
  box('Gearbox housing',[side*1.2,.56,z],[.22,.36,.34],'#797f83',1,explode=[side*.55,.1,z*.25])
# Central battery, front black linkage carriage, servo and twin rails.
box('Battery pack',[-.48,.77,-.6],[.65,.35,1.1],'#1c2228',2,explode=[-.35,.7,-.2])
box('Battery strap',[-.48,.96,-.6],[.16,.035,1.12],'#38434a',2,explode=[-.35,.75,-.2])
for x in [-.49,.49]:
 box('Front mechanism side rail',[x,.94,.89],[.085,.085,1.96],'#424b50',2,explode=[x*.7,.5,.55])
 for z in [.2,.8,1.4]:
  box('Front mechanism cross brace',[0,.94,z],[1.05,.065,.065],'#aeb9be',2,explode=[0,.5,.5])
 box('Upright linkage mount',[x,1.18,.0],[.08,.58,.1],'#30393f',2,explode=[x*.7,.55,.4])
box('Front servo body',[0,1.03,-.04],[.48,.4,.32],'#142836',2,explode=[0,.85,.2])
box('Blue servo bracket',[0,1.28,-.04],[.62,.08,.42],'#166591',2,explode=[0,.9,.2])
for x in [-.3,.3]:
 box('CORE support fork',[x,.68,1.87],[.07,.07,.85],'#53626a',2,explode=[x*.7,.45,.9])
box('Front gripper crosspiece',[0,.69,1.52],[.72,.1,.1],'#2f3b43',2,explode=[0,.45,.85])
ring()
# Visible PCB and connectors on right rear of chassis, no invented sensor mast.
box('Controller mounting plate',[.57,.98,-.66],[.95,.05,1.39],'#b7cbd0',2,.22,explode=[.25,.9,-.2])
box('Control board',[.57,1.08,-.66],[.87,.065,1.22],'#217b77',2,explode=[.25,1.05,-.2])
for x,z in [(.35,-.45),(.68,-.85),(.38,-.93)]:
 box('PCB integrated circuit',[x,1.145,z],[.22,.065,.22],'#26363c',2,explode=[.25,1.05,-.2])
for z in [-1.12,-.92,-.72,-.52,-.32]:
 box('Controller connection header',[.94,1.17,z],[.12,.12,.13],'#e1d6ae',2,explode=[.25,1.05,-.2])
box('Controller USB connector',[.25,1.17,-.65],[.16,.13,.24],'#b5c1c6',2,explode=[.25,1.05,-.2])
for x in [.28,.85]:
 for z in [-1.18,-.14]:cyl('Board standoff',[x,1.03,z],.035,.13,'#c6cbca',2,axis='y',n=8,explode=[.25,.95,-.2])
# Wiring harnesses are visual routing approximations from the photo.
for k,(color,start,end) in enumerate([('#e78c24',[-.3,1.18,0],[.92,1.18,-.7]),('#dc4d3b',[-.7,.91,-.7],[.8,1.18,-1.12]),('#26343b',[-.65,.93,-.8],[.3,1.18,-.3]),('#e8ae3d',[-.3,1.18,0],[-1.0,.77,1.04])]):
 points=[]
 for i in range(15):
  t=i/14;points.append([start[j]*(1-t)+end[j]*t+(math.sin(t*math.pi)*(.24 if j==1 else .13 if j==0 else .18)) for j in range(3)])
 for i,(a,b) in enumerate(zip(points,points[1:])):
  p=[(a[j]+b[j])/2 for j in range(3)];d=[b[j]-a[j] for j in range(3)];length=sum(v*v for v in d)**.5
  # Small overlapping spheres along harness for simple shared rendering.
  direction=[q/length for q in d];ref=[0,1,0] if abs(direction[1])<.9 else [1,0,0]
  cross=lambda a,b:[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
  u=cross(direction,ref);norm=sum(q*q for q in u)**.5;u=[q/norm for q in u];v=cross(direction,u)
  verts=[[end*d[j]/2+.025*(u[j]*math.cos(k*math.tau/6)+v[j]*math.sin(k*math.tau/6)) for j in range(3)] for end in [-1,1] for k in range(6)]
  part('Wiring harness segment',p,verts,[[j,(j+1)%6,(j+1)%6+6,j+6] for j in range(6)],color,2,explode=[0,.65,0])
(ROOT/'assets/robot.json').write_text(json.dumps(parts,separators=(',',':'))+'\n')
print(f'Built {len(parts)} photo-referenced parts; CORE outer/inner/thickness = 95/55/30 relative millimetres')
