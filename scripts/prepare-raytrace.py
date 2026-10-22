"""Export shared geometry with angle-weighted hard-edge-preserving smooth normals."""
import json,math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
parts=json.loads((root/'assets/robot.json').read_text());triangles=[]
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def normalize(a):
 length=math.sqrt(sum(x*x for x in a)) or 1
 return [x/length for x in a]
for p in parts:
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
   triangles.append(sum([vertices[i] for i in ids],[])+color+p['explode']+[p.get('delay',0),material]+normals)
out=root/'dist/studio-frames';out.mkdir(parents=True,exist_ok=True)
(root/'dist/studio-triangles.txt').write_text(str(len(triangles))+'\n'+'\n'.join(' '.join(map(str,t)) for t in triangles))
print(len(triangles),'triangles exported')
