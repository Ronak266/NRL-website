"""Photo-referenced Hyperdrive chassis. Units are relative, not measured CAD."""
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parts=[]
def part(name,p,v,f,c,g=0,alpha=1,explode=None,**extra):
 parts.append(dict(name=name,p=p,v=v,f=f,c=c,g=g,alpha=alpha,explode=explode or [0,.7+g*.3,0],**extra))
def box(name,p,s,c,g=0,alpha=1,angle=0,explode=None,rx=0,**extra):
 if alpha==1 and min(s)>.025:
  # Small machined edge breaks catch the studio light without rounding the part away.
  b=min(.012,min(s)*.16);v=[]
  for yy,inset in [(-s[1]/2,b),(-s[1]/2+b,0),(s[1]/2-b,0),(s[1]/2,b)]:
   hx=s[0]/2-inset;hz=s[2]/2-inset;ch=min(b,hx*.3,hz*.3)
   for xx,zz in [(-hx+ch,-hz),(hx-ch,-hz),(hx,-hz+ch),(hx,hz-ch),(hx-ch,hz),(-hx+ch,hz),(-hx,hz-ch),(-hx,-hz+ch)]:
    vx=xx*math.cos(angle)-yy*math.sin(angle);vy=xx*math.sin(angle)+yy*math.cos(angle)
    v.append([vx,vy*math.cos(rx)-zz*math.sin(rx),vy*math.sin(rx)+zz*math.cos(rx)])
  f=[list(range(7,-1,-1)),list(range(24,32))]
  f.extend([[j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i] for j in range(3) for i in range(8)])
  part(name,p,v,f,c,g,alpha,explode,**extra);return
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
def lathe(name,p,profile,c,g=0,axis='y',n=32,**extra):
 """Closed radial profile: real bores and socket cavities, not black decals."""
 v=[]
 for radius,height in profile:
  for i in range(n):
   a=math.tau*i/n; q=[radius*math.cos(a),height,radius*math.sin(a)]
   if axis=='x':q=[q[1],q[0],q[2]]
   if axis=='z':q=[q[0],q[2],q[1]]
   v.append(q)
 f=[]
 for j in range(len(profile)):
  for i in range(n):f.append([j*n+i,j*n+(i+1)%n,((j+1)%len(profile))*n+(i+1)%n,((j+1)%len(profile))*n+i])
 part(name,p,v,f,c,g,**extra)
def merge_since(start,name,**extra):
 """Keep the manufactured object's detail together during disassembly."""
 pieces=parts[start:]; base=pieces[0]; vertices=[];faces=[]
 for piece in pieces:
  k=len(vertices);vertices.extend([[v[j]+piece['p'][j]-base['p'][j] for j in range(3)] for v in piece['v']]);faces.extend([[i+k for i in face] for face in piece['f']])
 base.update(name=name,v=vertices,f=faces,**extra);parts[start:]=[base]
def screw(name,p,g=0,axis='x',length=.11,explode=None,wheel=None,**extra):
 start=len(parts); opts={'explode':explode,'system':'drive' if g==1 else 'frame' if g==0 else 'electronics','hardware':True,'material':'metal'}
 opts.update(extra)
 if wheel is not None:opts['wheel']=wheel
 # Chamfered socket head with a recessed six-sided Allen drive.
 lathe(name,p,[(.030,-.015),(.038,-.010),(.038,.018),(.032,.026),(.018,.026),(.018,.010),(.001,.010),(.001,-.015)],'#9caab4',g,axis,n=6,**opts)
 lathe('Captive steel washer',p,[(.022,-.021),(.049,-.021),(.049,-.016),(.022,-.016)],'#bdc6cc',g,axis,n=24,**opts)
 lathe('Threaded steel shank',p,[(.001,-length),(.021,-length),(.021,-.014),(.001,-.014)],'#7c8c96',g,axis,n=16,**opts)
 # A continuous helical crest, joined into the bolt mesh rather than separate rings.
 verts=[];faces=[];turns=max(3,round(length/.014));steps=turns*12
 for i in range(steps+1):
  a=math.tau*i/12;h=-length+(length-.019)*i/steps
  for r,dh in [(.020,-.003),(.026,0),(.020,.003)]:
   q=[r*math.cos(a),h+dh,r*math.sin(a)]
   if axis=='x':q=[q[1],q[0],q[2]]
   if axis=='z':q=[q[0],q[2],q[1]]
   verts.append(q)
 for i in range(steps):
  for j in range(2):faces.append([i*3+j,(i+1)*3+j,(i+1)*3+j+1,i*3+j+1])
 part('Helical thread crest',p,verts,faces,'#aebbc3',g,**opts)
 merge_since(start,name,hardware=True,fastenerAxis=axis,detail='Recessed hex socket, captive washer and helical thread')
 if axis=='x' and p[0]<0:
  parts[-1]['v']=[[ -v[0],v[1],v[2]] for v in parts[-1]['v']]
  parts[-1]['f']=[face[::-1] for face in parts[-1]['f']]
def channel(name,p,length,axis='z',explode=None):
 start=len(parts)
 # Open U-section with visible wall thickness and an internal cavity.
 for center,size in [([0,-.029,0],[.10,.018,length]),([-.043,.008,0],[.014,.074,length]),([.043,.008,0],[.014,.074,length])]:
  if axis=='x':center=[center[2],center[1],center[0]];size=[size[2],size[1],size[0]]
  box(name,[p[j]+center[j] for j in range(3)],size,'#bac4cc',0,explode=explode,material='metal')
 merge_since(start,name,detail='Hollow aluminium U-channel')
def gear(name,p,r,n=20,axis='y',**extra):
 # Extruded tooth outline and a through bore. Each gear is one physical part.
 outline=[]
 for tooth in range(n):
  for fraction,scale in [(0,.91),(.18,.91),(.34,1.06),(.66,1.06),(.82,.91)]:
   a=(tooth+fraction)*math.tau/n;outline.append((a,r*scale))
 v=[];m=len(outline)
 for inside,height in [(False,-.026),(False,.026),(True,-.026),(True,.026)]:
  for a,radius in outline:
   rr=.031 if inside else radius;q=[rr*math.cos(a),height,rr*math.sin(a)]
   if axis=='x':q=[q[1],q[0],q[2]]
   v.append(q)
 f=[]
 for i in range(m):
  j=(i+1)%m
  f.extend([[i,j,m+j,m+i],[2*m+i,3*m+i,3*m+j,2*m+j],[i,2*m+i,2*m+j,j],[m+i,m+j,3*m+j,3*m+i]])
 part(name,p,v,f,'#b5a67e',2,system='mechanism',material='metal',**extra)
def rack(name,p,length,axis='x',**extra):
 start=len(parts)
 size=[length,.055,.065] if axis=='x' else [.065,length,.055]
 box(name,p,size,'#a5b0b5',2,system='mechanism',material='metal',**extra)
 spacing=math.tau*(.13 if axis=='x' else .17)/(16 if axis=='x' else 20)
 for i in range(int(length/spacing)):
  d=-length/2+(i+.5)*spacing;q=p.copy();q[0 if axis=='x' else 1]+=d;q[2]+=extra.get('toothDirection',1)*.041
  box('Rack tooth',q,[.026,.055,.026] if axis=='x' else [.065,.026,.026],'#a5b0b5',2,system='mechanism',material='metal',**extra)
 merge_since(start,name)
def servo(name,p,axis='y',**extra):
 start=len(parts);opts=dict(system='mechanism',**extra)
 box(name+' housing',p,[.34,.38,.46],'#252b30',2,material='metal',**opts)
 box(name+' gearbox cover',[p[0],p[1]+.212,p[2]],[.35,.065,.47],'#54626e',2,material='metal',**opts)
 box(name+' rear cover',[p[0],p[1]-.205,p[2]],[.34,.045,.46],'#141b22',2,**opts)
 for side in [-1,1]:
  box(name+' mounting ear',[p[0]+side*.235,p[1]+.10,p[2]],[.15,.055,.46],'#3b4650',2,material='metal',**opts)
  for z in [-.15,.15]:screw(name+' mounting screw',[p[0]+side*.25,p[1]+.15,p[2]+z],g=2,axis='y',length=.12,**opts)
 shaft=[p[0],p[1]+.29,p[2]+.11]
 shaftopts={**opts,'motion':{**opts.get('motion',{}),'rotor':'grip' if name=='Gripper servo' else 'lift'}}
 cyl(name+' splined output shaft',shaft,.052,.10,'#b8a467',2,axis='y',n=32,material='metal',**shaftopts)
 box(name+' label',[p[0],p[1]-.01,p[2]+.234],[.26,.18,.008],'#307fa3',2,**opts)
 for i in range(4):box(name+' case rib',[p[0],p[1]-.11+i*.065,p[2]-.237],[.31,.018,.016],'#5d6971',2,material='metal',**opts)
 if axis=='x':
  for item in parts[start:]:
   a=item['p'];item['p']=[p[0]+a[1]-p[1],p[1]+a[0]-p[0],a[2]]
   item['v']=[[v[1],v[0],v[2]] for v in item['v']];item['f']=[f[::-1] for f in item['f']]
   if item.get('hardware'):item['fastenerAxis']='x'
def ring():
 n=40;profile=[(.315,-.15),(.435,-.15),(.475,-.11),(.475,.11),(.435,.15),(.315,.15),(.275,.11),(.275,-.11)]
 v=[[r*math.cos(i*math.tau/n),y,r*math.sin(i*math.tau/n)] for i in range(n) for r,y in profile]
 f=[[i*8+j,((i+1)%n)*8+j,((i+1)%n)*8+(j+1)%8,i*8+(j+1)%8] for i in range(n) for j in range(8)]
 part('Yellow CORE held at front',[0,.85,2.02],v,f,'#eec54e',2,explode=[0,.75,1.1],core=True,motion={'heldCore':True})
# Low, open rectangular chassis, clear acrylic sides, silver channel frame.
box('Clear lower chassis deck',[0,.51,0],[2.65,.07,3.25],'#afc9d1',0,.23,explode=[0,-.12,0])
for x in [-1.3,1.3]:
 side=1 if x>0 else -1
 box('Acrylic side plate',[x,.94,0],[.055,.8,3.26],'#bbd8df',0,.18,explode=[side*.75,.12,0])
 for z in [-1.57,1.57]:
  box('Side plate upright',[x,.94,z],[.055,.83,.055],'#bac4c7',0,explode=[side*.6,.12,0])
 for y in [.58,1.32]:
  channel('Longitudinal aluminium channel',[x,y,0],3.26,explode=[side*.55,0,0])
 for z in [-1.4,-1,-.6,-.2,.2,.6,1,1.4]:
  screw('Chassis mounting socket screw',[x+side*.06,1.16,z],axis='x',explode=[side*.75,.12,0])
for z in [-1.57,-.55,.65,1.57]:
 channel('Cross chassis support',[0,.65,z],2.55,axis='x',explode=[0,-.2,z*.25])
box('Clear rear wall',[0,1.02,-1.62],[2.65,.72,.055],'#bbd8df',0,.2,explode=[0,.3,-.55])
# Four conventional rubber traction wheels, not mecanum or omni rollers.
for x in [-1.57,1.57]:
 side=1 if x>0 else -1
 for z in [-1.06,1.06]:
  center=[x,.56,z];exp=[side*.9,0,z*.25]
  lathe('Rubber traction wheel',center,[(.305,-.19),(.43,-.19),(.50,-.16),(.537,-.11),(.545,0),(.537,.11),(.50,.16),(.43,.19),(.305,.19)],'#151719',1,axis='x',n=64,explode=exp,wheel=center,material='rubber')
  for i in range(40):
   a=i*math.tau/40
   box('Tyre tread lug',[x,.56+.538*math.cos(a),z+.538*math.sin(a)],[.29,.022,.058],'#202224',1,explode=exp,wheel=center,rx=a)
  start=len(parts);hub=[x+side*.205,.56,z]
  lathe('Silver wheel hub',hub,[(.244,-.025),(.29,-.025),(.31,-.01),(.31,.01),(.29,.026),(.244,.026)],'#a9b2b7',1,axis='x',n=48,explode=exp,wheel=center,material='metal')
  for k in range(6):
   a=k*math.tau/6
   box('Machined hub spoke',[hub[0],.56+.17*math.cos(a),z+.17*math.sin(a)],[.045,.19,.046],'#a9b2b7',1,explode=exp,wheel=center,rx=a)
  merge_since(start,'Silver wheel hub',material='metal',wheel=center,detail='Open six-spoke rim with machined lip')
  lathe('Hub center',[x+side*.23,.56,z],[(.054,-.03),(.095,-.03),(.106,-.02),(.106,.02),(.095,.03),(.054,.03)],'#89969f',1,axis='x',n=40,explode=exp,wheel=center,material='metal')
  cyl('DC drive motor',[side*.95,.56,z],.17,.53,'#aab0b4',1,n=48,explode=[side*.45,.15,z*.25])
  box('Gearbox housing',[side*1.2,.56,z],[.22,.36,.34],'#797f83',1,explode=[side*.55,.1,z*.25])
# Central battery, front black linkage carriage, servo and twin rails.
box('Battery pack',[-.48,.77,-.6],[.65,.35,1.1],'#1c2228',2,explode=[-.35,.7,-.2])
box('Battery strap',[-.48,.96,-.6],[.16,.035,1.12],'#38434a',2,explode=[-.35,.75,-.2])
# Proposed complete CORE module: guided vertical lift and servo rack gripper.
lifted={'lift':True}
servo('Lift servo',[-1.03,.98,-.10],axis='x',mountExplode=[-.65,.20,-.15])
for y in [.745,1.215]:box('Lift servo window bracket crossbar',[-.98,y,-.10],[.045,.065,.60],'#8196a3',2,system='mechanism',material='metal',mountExplode=[-.65,.20,-.15])
for z in [-.38,.18]:box('Lift servo window bracket upright',[-.98,.98,z],[.045,.60,.055],'#8196a3',2,system='mechanism',material='metal',mountExplode=[-.65,.20,-.15])
box('Lift servo chassis mounting foot',[-1.05,.66,-.10],[.40,.07,.65],'#8196a3',2,system='mechanism',material='metal',mountExplode=[-.65,.20,-.15])
gear('Lift drive pinion',[-.69,.98,.01],.17,20,axis='x',motion={'rotor':'lift'},mountExplode=[-.85,.20,-.15])
rack('Lift rack',[-.69,1.075,.215],1.04,axis='y',toothDirection=-1,motion=lifted,mountExplode=[-.25,.75,.18])
for x in [-.62,.62]:
 box('Lift guide mounting foot',[x,.66,.56],[.23,.07,.30],'#8698a2',2,system='mechanism',material='metal',mountExplode=[x*.6,.15,-.3])
 cyl('Lift guide shaft',[x,1.18,.56],.045,1.20,'#bbc4cb',2,axis='y',n=40,system='mechanism',material='metal',mountExplode=[x*.5,.55,-.25])
 lathe('Lift linear bearing',[x,.95,.56],[(.047,-.115),(.085,-.115),(.085,.115),(.047,.115)],'#647984',2,n=32,system='mechanism',material='metal',motion=lifted,mountExplode=[x*.5,.6,.1])
 for z in [.48,.64]:screw('Lift guide mounting bolt',[x,.72,z],g=2,axis='y',system='mechanism',mountExplode=[x*.5,.40,-.3])
box('Lift top bridge',[0,1.80,.56],[1.40,.07,.18],'#a2b1ba',2,system='mechanism',material='metal',mountExplode=[0,.8,-.2])
box('Lift carriage plate',[0,.82,1.07],[1.36,.065,1.01],'#9eacb5',2,system='mechanism',material='metal',motion=lifted,mountExplode=[0,.65,.4])
box('Lift rack attachment bracket',[-.69,.91,.40],[.18,.16,.46],'#687c8a',2,system='mechanism',material='metal',motion=lifted,mountExplode=[-.3,.7,.2])
servo('Gripper servo',[0,1.07,1.55],motion=lifted,mountExplode=[0,.8,.55])
for side in [-1,1]:
 box('Gripper servo cantilever mount',[side*.43,.94,1.30],[.065,.10,1.0],'#8297a4',2,system='mechanism',material='metal',motion=lifted,mountExplode=[side*.3,.65,.45])
 for z in [1.40,1.70]:box('Gripper servo mount post',[side*.43,1.06,z],[.065,.14,.065],'#8297a4',2,system='mechanism',material='metal',motion=lifted,mountExplode=[side*.3,.65,.45])
for z in [1.40,1.70]:box('Gripper servo mounting crossbar',[0,1.13,z],[.91,.06,.065],'#8297a4',2,system='mechanism',material='metal',motion=lifted,mountExplode=[0,.7,.45])
gear('Gripper drive pinion',[0,1.40,1.66],.13,16,motion={'lift':True,'rotor':'grip'},mountExplode=[0,1.0,.55])
for z in [1.22,1.98]:
 cyl('Gripper jaw guide shaft',[0,1.15,z],.038,1.98,'#c2cbd0',2,axis='x',n=40,system='mechanism',material='metal',motion=lifted,mountExplode=[0,.4,z*.5])
 for side in [-1,1]:
  box('Gripper shaft support',[side*.94,1.03,z],[.14,.25,.14],'#6b7e8b',2,system='mechanism',material='metal',motion=lifted,mountExplode=[side*.35,.4,z*.45])
for side,label in [(-1,'Left'),(1,'Right')]:
 moving={'lift':True,'jaw':side}
 rack(label+' gripper rack',[side*.32,1.40,1.48 if side>0 else 1.84],.90,toothDirection=1 if side>0 else -1,motion=moving,mountExplode=[side*.55,.9,.45])
 box(label+' rack-to-jaw bracket',[side*.79,1.32,1.48 if side>0 else 1.84],[.14,.18,.14],'#8a9ba8',2,system='mechanism',material='metal',motion=moving,mountExplode=[side*.55,.75,.45])
 box(label+' gripper jaw carriage',[side*.79,1.26,1.60],[.14,.065,.94],'#8296a3',2,system='mechanism',material='metal',motion=moving,mountExplode=[side*.6,.55,.55])
 for z in [1.22,1.98]:lathe('Gripper sliding bushing',[side*.79,1.15,z],[(.040,-.08),(.069,-.08),(.069,.08),(.040,.08)],'#ab9663',2,axis='x',n=24,system='mechanism',material='metal',motion=moving,mountExplode=[side*.7,.5,.5])
 start=len(parts)
 box(label+' finger upright',[side*.79,1.06,2.02],[.09,.40,.12],'#8d9eaa',2,system='mechanism',material='metal',motion=moving,mountExplode=[side*.65,.35,.8])
 box(label+' finger tip',[side*.79,.85,2.02],[.09,.10,.60],'#8d9eaa',2,system='mechanism',material='metal',motion=moving,mountExplode=[side*.65,.35,.8])
 merge_since(start,label+' gripper finger')
 box(label+' rubber grip pad',[side*.745,.85,2.02],[.065,.25,.51],'#20272a',2,system='mechanism',material='rubber',motion=moving,mountExplode=[side*.9,.35,.8])
 for z in [1.82,2.22]:screw(label+' finger pad screw',[side*.84,.85,z],g=2,axis='x',system='mechanism',motion=moving,mountExplode=[side*1.05,.35,.8])
 box('Gripper cantilever support',[side*.94,.94,1.52],[.10,.10,1.06],'#7c919d',2,system='mechanism',material='metal',motion=lifted,mountExplode=[side*.4,.45,.5])
 # Fixed pickup rests support a loose CORE until the moving jaws grip and lift it.
 box('CORE pickup rest',[side*.29,.665,1.91],[.065,.07,.87],'#6a7c88',2,system='mechanism',material='metal',mountExplode=[side*.4,.2,.8])

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
 for z in [-1.18,-.14]:lathe('Brass threaded standoff',[x,1.03,z],[(.018,-.065),(.043,-.065),(.043,.065),(.018,.065)],'#ad8d4d',2,n=6,explode=[.25,.95,-.2],system='electronics',material='metal')
# Curved individual wire routes; each wire is a single continuous tube mesh.
def tube(name,start,end,color,index,**extra):
 points=[];n=24;sides=8
 for i in range(n):
  t=i/(n-1);arc=math.sin(t*math.pi)
  points.append([start[j]*(1-t)+end[j]*t+arc*([.16,.28,.12][j]) for j in range(3)])
 vertices=[]
 for i,point in enumerate(points):
  a=points[max(0,i-1)];b=points[min(n-1,i+1)];d=[b[j]-a[j] for j in range(3)];l=math.sqrt(sum(v*v for v in d));d=[v/l for v in d]
  ref=[0,1,0] if abs(d[1])<.9 else [1,0,0]
  cross=lambda a,b:[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
  u=cross(d,ref);l=math.sqrt(sum(v*v for v in u));u=[v/l for v in u];v=cross(d,u)
  for k in range(sides):vertices.append([point[j]+.018*(u[j]*math.cos(k*math.tau/sides)+v[j]*math.sin(k*math.tau/sides)) for j in range(3)])
 faces=[[i*sides+k,i*sides+(k+1)%sides,(i+1)*sides+(k+1)%sides,(i+1)*sides+k] for i in range(n-1) for k in range(sides)]
 exp=[-3.5-index*.15,1.8+(index%4)*.42,-1.5+(index//4)*2.5]
 part(name,[0,0,0],vertices,faces,color,2,explode=exp,system='wiring',wire=True,delay=.48+index*.018,**extra)
 for endno,point in enumerate([start,end]):
  box('Wire %02d terminal %d'%(index+1,endno+1),point,[.08,.06,.12],'#d6bd83',2,explode=[exp[0]-.14,exp[1]+.15,exp[2]],system='electronics',motion={'lift':True} if endno==0 and extra.get('flexLift') else {})
routes=[
 ('Gripper servo signal',[0,.93,1.34],[.92,1.18,-.7],'#ee9e34'),
 ('Battery positive to switch',[-.7,.91,-.7],[-.50,1.02,-1.24],'#d64543'),
 ('Battery ground',[-.65,.93,-.8],[.02,1.10,-1.15],'#26343b'),
 ('Front left motor power',[.90,1.18,-.32],[-1,.77,1.04],'#e8ae3d'),
 ('Front left motor return',[.84,1.18,-.52],[-1,.72,1.04],'#2e3d47'),
 ('Front right motor power',[.94,1.18,-.32],[1,.76,1.04],'#d95543'),
 ('Rear left motor power',[.92,1.18,-.92],[-1,.75,-1.06],'#e9b743'),
 ('Rear right motor power',[.94,1.18,-1.12],[1,.76,-1.06],'#d74d43'),
 ('Rear left motor return',[.83,1.19,-.88],[-1,.71,-1.06],'#35434b'),
 ('Rear right motor return',[.84,1.18,-.72],[1,.71,-1.06],'#36424a')]
routes.extend([
 ('Gripper servo power',[.06,.93,1.34],[.12,1.10,-1.15],'#d44837'),
 ('Gripper servo ground',[-.06,.93,1.34],[.02,1.10,-1.15],'#252f38'),
 ('Lift servo signal',[-1.15,.82,-.22],[.93,1.18,-.52],'#e4a337'),
 ('Lift servo power',[-1.12,.82,-.22],[.12,1.10,-1.15],'#d44837'),
 ('Lift servo ground',[-1.09,.82,-.22],[.02,1.10,-1.15],'#252f38'),
 ('Switch to fuse',[-.36,1.02,-1.24],[-.18,.96,-1.20],'#cc4136'),
 ('Fused controller supply',[-.06,.96,-1.20],[.8,1.18,-1.12],'#cc4136'),
 ('Regulator input',[-.06,.96,-1.20],[.15,1.04,-1.30],'#cc4136'),
 ('Controller ground',[.02,1.10,-1.15],[.3,1.18,-.3],'#26343b'),
 ('Front right motor return',[.82,1.18,-.32],[1,.72,1.04],'#26343b')])
for index,(name,a,b,color) in enumerate(routes):tube(name,a,b,color,index,flexLift=name.startswith('Gripper servo'))
box('Main power switch',[-.42,.91,-1.24],[.24,.20,.23],'#232b31',2,system='electronics',material='polymer')
box('Main switch rocker',[-.42,1.03,-1.24],[.13,.07,.16],'#c83235',2,system='electronics')
box('Inline fuse holder',[-.12,.93,-1.20],[.24,.13,.22],'#243b42',2,system='electronics')
box('Servo power regulator',[.08,1.00,-1.22],[.36,.10,.31],'#24514b',2,system='electronics')
box('Servo power distribution block',[.09,1.08,-1.10],[.38,.12,.12],'#303d45',2,system='electronics')
for i in range(4):box('Regulator heatsink fin',[-.04+i*.075,1.11,-1.22],[.025,.14,.24],'#83929b',2,system='electronics',material='metal')
# More visible mechanical detail: hub bolts, axles, ventilated motor endcaps.
for x in [-1.57,1.57]:
 side=1 if x>0 else -1
 for z in [-1.06,1.06]:
  center=[x,.56,z]
  for k in range(6):
   a=k*math.tau/6
   screw('Hub socket bolt',[x+side*.25,.56+.19*math.cos(a),z+.19*math.sin(a)],g=1,axis='x',explode=[side*1.0,0,z*.25],wheel=center)
  cyl('Drive axle',[side*1.3,.56,z],.055,.6,'#c9d6df',1,n=12,explode=[side*1.5,-.18,z*.65])
  cyl('Motor end cap',[side*.67,.56,z],.174,.04,'#59626b',1,n=20,explode=[side*.85,.38,z*.65])
# Physical mounting hardware: bored bearing rings, flanged motor plates, nuts and gussets.
for side in [-1,1]:
 for z in [-1.06,1.06]:
  exp=[side*.55,.12,z*.25]
  lathe('Flanged axle bearing',[side*1.31,.56,z],[(.060,-.025),(.115,-.025),(.128,-.015),(.128,.015),(.115,.025),(.060,.025)],'#89969f',1,axis='x',explode=exp,system='drive',material='metal')
  for dz in [-.20,.20]:
   screw('Motor mount cap screw',[side*1.37,.68,z+dz],g=1,axis='x',length=.14,explode=exp)
  start=len(parts)
  box('Motor mounting foot',[side*1.16,.70,z],[.38,.035,.52],'#99a8b4',1,explode=exp)
  box('Motor mounting cheek',[side*1.30,.56,z],[.035,.31,.52],'#99a8b4',1,explode=exp)
  merge_since(start,'Folded motor mounting bracket',material='metal',system='drive')
 for z in [-1.48,1.48]:
  exp=[side*.55,.15,z*.22]
  start=len(parts)
  box('Corner angle horizontal',[side*1.18,.70,z],[.30,.032,.27],'#9eaeb8',0,explode=exp)
  box('Corner angle vertical',[side*1.30,.82,z],[.032,.27,.27],'#9eaeb8',0,explode=exp)
  merge_since(start,'Chassis corner angle bracket',material='metal',system='frame')
  for dz in [-.07,.07]:screw('Corner bracket socket screw',[side*1.18,.744,z+dz],axis='y',explode=exp)
for x in [.28,.85]:
 for z in [-1.18,-.14]:
  screw('PCB mounting socket screw',[x,1.145,z],g=2,axis='y',length=.16,explode=[.25,1.05,-.2])
# Tyre tread is integral to the tyre, so combine its mesh instead of exploding rubber lugs.
for wheel in [p for p in parts if p['name']=='Rubber traction wheel']:
 lugs=[p for p in parts if p['name']=='Tyre tread lug' and p['wheel']==wheel['wheel']]
 for lug in lugs:
  offset=len(wheel['v']);wheel['v'].extend([[v[j]+lug['p'][j]-wheel['p'][j] for j in range(3)] for v in lug['v']]);wheel['f'].extend([[i+offset for i in f] for f in lug['f']]);parts.remove(lug)
# Fabricated PETG parts retain individual motion and separate steel fasteners.
printed_names={'Lift carriage plate','Lift rack attachment bracket','Gripper servo cantilever mount','Gripper servo mount post','Gripper shaft support','Left rack-to-jaw bracket','Right rack-to-jaw bracket','Left gripper jaw carriage','Right gripper jaw carriage','Left gripper finger','Right gripper finger','Gripper cantilever support','CORE pickup rest'}
for item in parts:
 if item['name'] in printed_names:
  item.update(material='printed',c='#343d43',printLayerHeight=.006,detail='Layered PETG printed part with chamfered edges')
# Distinct physical parts have individual assembly lanes, timings and materials.
counts={}
for item in parts:
 name=item['name']
 system=item.get('system') or ('drive' if item['g']==1 else 'frame' if item['g']==0 else 'electronics' if any(k in name for k in ['Controller','Control board','PCB','Board standoff','Battery']) else 'mechanism')
 item['system']=system;idx=counts.get(system,0);counts[system]=idx+1
 if system=='wiring':
  item['explode']=[-1.0-idx*.025,.85+(idx%4)*.09,.15];item['delay']=.50+idx*.008
  continue
 if system=='frame':
  exp=item['explode'];item['explode']=[exp[0]*3.2+(idx%3-1)*.12,exp[1]*2.4+(idx%4)*.18,exp[2]*3+(idx%5-2)*.16]
  if 'fastener' in name:item['explode']=[(-1 if item['p'][0]<0 else 1)*3.2,.7+(idx%4)*.27,(idx//4%4-1.5)*.72]
  item['delay']=.02+(idx%6)*.018
 elif system=='drive':
  item['explode']=[item['explode'][0]*2.2,item['explode'][1]*2+(idx%3)*.18,item['explode'][2]*2.8];item['delay']=.13+(idx%4)*.025
 elif system=='mechanism':
  item['explode']=[item['explode'][0]*2+(idx%3-1)*.5,item['explode'][1]*2.4,item['explode'][2]*2.5+(idx%3)*.24];item['delay']=.27+(idx%4)*.025
 else:
  item['explode']=[3.6+(idx%4)*.6,.6+(idx//4)*.26,-2.2+(idx%3)*.55];item['delay']=.37+(idx%5)*.02
 item['material']=item.get('material') or ('glass' if item.get('alpha',1)<1 else 'rubber' if 'Rubber' in name else 'metal' if any(k in name.lower() for k in ['hub','aluminium','support','bolt','axle','fastener','screw','rail','motor','standoff','bracket']) else 'polymer')
 if item.get('hardware'):
  axis=item['fastenerAxis'];direction=-1 if axis=='x' and item['p'][0]<0 else 1
  item['explode']=[0,0,0];item['explode'][{'x':0,'y':1,'z':2}[axis]]=direction*(2.4 if axis=='x' else 2.1)
  item['delay']=.015
 # Keep soldered and mechanically attached objects together. Parts withdraw along
 # their real mounting axes instead of scattering into arbitrary display lanes.
 side=-1 if item['p'][0]<0 else 1
 if system=='frame':
  item['explode']=[side*.65 if 'side' in name.lower() or 'Longitudinal' in name else 0,-.12 if 'lower' in name else .28,-.75 if 'rear wall' in name else 0]
  item['delay']=.20
 elif system=='drive':
  travel=1.05 if 'Rubber' in name else 1.35 if name=='Silver wheel hub' else 1.6 if name=='Hub center' else .45
  item['explode']=[side*travel,0,0];item['delay']=.13
 elif system=='mechanism':
  item['explode']=[item['p'][0]*.15,.55,.65 if item['p'][2]>.5 else .15];item['delay']=.30
 elif system=='electronics':
  item['explode']=[-.12,.75,-.35] if 'Battery' in name else [0,1.22,0]
  if 'mounting plate' in name:item['explode']=[0,.65,0]
  item['delay']=.40
 elif system=='wiring':
  item['explode']=[-1.0-index*.025,.85+(index%4)*.09,.15];item['delay']=.50+index*.008
 if item.get('hardware'):
  axis=item['fastenerAxis'];item['explode']=[0,0,0];item['explode'][{'x':0,'y':1,'z':2}[axis]]=side*1.85 if axis=='x' else 1.85
  item['delay']=.015
 if item.get('mountExplode'):
  item['explode']=item['mountExplode'];item['delay']=.05 if item.get('hardware') else .28
def compact(value):
 if isinstance(value,float):return round(value,5)
 if isinstance(value,list):return [compact(v) for v in value]
 if isinstance(value,dict):return {k:compact(v) for k,v in value.items()}
 return value
(ROOT/'assets/robot.json').write_text(json.dumps(compact(parts),separators=(',',':'))+'\n')
print(f'Built {len(parts)} independent components including {counts["wiring"]} continuous wire routes; proportions approximate.')
