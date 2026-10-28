"""Export shared geometry with angle-weighted hard-edge-preserving smooth normals."""
import json,math,runpy
from pathlib import Path
motion=runpy.run_path(str(Path(__file__).with_name("simulation-motion.py")))
root=Path(__file__).resolve().parents[1]
parts=json.loads((root/'assets/robot.json').read_text());triangles=[]
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def normalize(a):
 length=math.sqrt(sum(x*x for x in a)) or 1
 return [x/length for x in a]
wires=[p for p in parts if p.get('wire')]
layouts={p['name']:motion['wire_layout'](p,i,len(wires)) for i,p in enumerate(wires)}
for p in parts:
 target=layouts.get(p['name'])
 if p['name'].startswith('Wire ') and ' terminal ' in p['name']:
  import re
  match=re.match(r'Wire (\d+) terminal (\d+)',p['name'])
  wire=wires[int(match[1])-1];line=layouts[wire['name']];ring=line[:8] if match[2]=='0' else line[-8:]
  center=[sum(v[j] for v in ring)/8 for j in range(3)]
  target=[[v[j]+center[j] for j in range(3)] for v in p['v']]
 vertices=[[x+p['p'][i] for i,x in enumerate(v)] for v in p['v']]
 color=[(int(p['c'][i:i+2],16)/255)**2.2 for i in (1,3,5)]
 material={'rubber':0,'metal':1,'glass':2,'polymer':3}.get(p.get('material','polymer'),3)
 faces=[];adj=[[] for _ in vertices]
 for face in p['f']:
  a,b,c=[vertices[k] for k in face[:3]];normal=normalize(cross([b[i]-a[i] for i in range(3)],[c[i]-a[i] for i in range(3)]))
  faces.append((face,normal))
  for k in face:adj[k].append(normal)
 for face,normal in faces:
  for j in range(1,len(face)-1):
   ids=[face[0],face[j],face[j+1]];normals=[]
   for k in ids:
    nearby=[n for n in adj[k] if sum(n[i]*normal[i] for i in range(3))>.75]
    normals+=normalize([sum(n[i] for n in nearby) for i in range(3)])
   triangles.append(sum([vertices[i] for i in ids],[])+color+p['explode']+[.20 if target is not None else motion['service_stage'](p)[0],material]+normals+[.34 if target is not None else motion['service_stage'](p)[1]]+p['p']+[{'x':0,'y':1,'z':2}.get(p.get('fastenerAxis'),-1) if p.get('hardware') else -1]+[int(target is not None)]+sum([target[k] if target is not None else vertices[k] for k in ids],[])+sum([[math.cos(k%8*math.tau/8),0,math.sin(k%8*math.tau/8)] if p.get('wire') else normals[i*3:i*3+3] for i,k in enumerate(ids)],[]))
out=root/'dist/studio-frames';out.mkdir(parents=True,exist_ok=True)
(root/'dist/studio-triangles.txt').write_text(str(len(triangles))+'\n'+'\n'.join(' '.join(map(str,t)) for t in triangles))
print(len(triangles),'triangles exported')
