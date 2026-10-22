"""Render the photo-referenced Hyperdrive model to SVG and a silent 720p MP4.
Uses exactly the same polygon mesh as both interactive renderers.
"""
import json,math,subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
parts=json.loads((ROOT/'assets/robot.json').read_text())
W,H,FPS=1280,720,24
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',15)
big=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',30)
def project(p,a,w=W,h=H,pitch=.56):
 x,y,z=p;xx=x*math.cos(a)+z*math.sin(a);zz=x*math.sin(a)-z*math.cos(a);y-=.78
 yy=y*math.cos(pitch)+zz*math.sin(pitch);zz=-y*math.sin(pitch)+zz*math.cos(pitch)
 scale=min(w*1.15,h*1.8)/(8+zz)
 return w/2+xx*scale,h*.52-yy*scale,zz

def polygons(separation,a,w=W,h=H,spin=0,travel=0):
 result=[]
 for part in parts:
  amount=max(0,min(1,separation*1.5-part['g']*.16))
  p=[v+part['explode'][i]*amount for i,v in enumerate(part['p'])]
  world=[]
  for vertex in part['v']:
   q=[v+p[i] for i,v in enumerate(vertex)]
   if 'wheel' in part:
    center=[v+p[i]-part['p'][i] for i,v in enumerate(part['wheel'])];y=q[1]-center[1];z=q[2]-center[2]
    q[1]=center[1]+y*math.cos(spin)-z*math.sin(spin);q[2]=center[2]+y*math.sin(spin)+z*math.cos(spin)
   q[2]+=travel;world.append(q)
  verts=[project(v,a,w,h) for v in world]
  rgb=[int(part['c'][k:k+2],16) for k in [1,3,5]]
  for face in part['f']:
   aa,bb,cc=[world[k] for k in face[:3]];u=[bb[i]-aa[i] for i in range(3)];v=[cc[i]-aa[i] for i in range(3)]
   n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];length=math.sqrt(sum(x*x for x in n)) or 1
   light=.48+.58*abs((n[0]*-.4+n[1]*.85+n[2]*.35)/length)
   points=[verts[i] for i in face];color=tuple(min(255,round(c*light)) for c in rgb)
   result.append((sum(v[2] for v in points)/len(points),[v[:2] for v in points],color,part.get('alpha',1),part['name']))
 return sorted(result,key=lambda p:p[0],reverse=True)

def svg():
 w,h=600,540;lines=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 540" role="img" aria-label="Photo-referenced four-wheel Hyperdrive robot with front yellow CORE">','<title>Titan Forge Hyperdrive prototype visualization</title>']
 for _,v,c,alpha,name in polygons(0,.55,w,h):
  points=' '.join(f'{x:.2f},{y:.2f}' for x,y in v);col='#' + ''.join(f'{x:02x}' for x in c)
  lines.append(f'<polygon points="{points}" fill="{col}" fill-opacity="{alpha}" stroke="#a5bbc3" stroke-opacity="{.4 if alpha<1 else .22}" stroke-width=".4"/>')
 lines.append('</svg>');(ROOT/'assets/hyperdrive-robot.svg').write_text('\n'.join(lines))
svg()
process=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'assets/forge-simulation.mp4')],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
for frame in range(12*FPS):
 t=frame/FPS;phase=min(2,int(t/4));a=.55+(.5*math.sin(max(0,t-4)*.4) if phase==1 else .1*math.sin(t*.5))
 im=Image.new('RGB',(W,H),(15,20,23));d=ImageDraw.Draw(im,'RGBA')
 for j in range(-7,8):
  for ends in [((j,0,-7),(j,0,7)),((-7,0,j),(7,0,j))]:d.line([project(v,a)[:2] for v in ends],fill=(36,50,56,255),width=1)
 separation=max(0,1-t/3.6) if phase==0 else 0
 travel=.35*math.sin((t-8)*1.3) if phase==2 else 0
 spin=-travel/.54
 for _,v,c,alpha,name in polygons(separation,a,spin=spin,travel=travel):
  d.polygon(v,fill=(*c,round(alpha*255)),outline=(142,161,169,round((.4 if alpha<1 else .25)*255)))
 d.rectangle((35,30,1245,690),outline=(61,72,76,255))
 d.text((60,52),'TITAN FORGE / HYPERDRIVE PROTOTYPE',font=font,fill=(240,237,228,255))
 d.text((60,90),['01 / CHASSIS ASSEMBLY','02 / PROTOTYPE INSPECTION','03 / TRACTION DRIVE STUDY'][phase],font=big,fill=(255,109,55,255))
 d.text((60,624),'PHOTO-REFERENCED VISUALIZATION / PROPORTIONS APPROXIMATE',font=font,fill=(160,174,177,255))
 d.text((1080,624),f'{t:04.1f} / 12s',font=font,fill=(240,237,228,255))
 d.line((60,660,1220,660),fill=(51,64,68,255),width=3);d.line((60,660,60+int(1160*t/12),660),fill=(255,109,55,255),width=3)
 if frame==96:im.save(ROOT/'assets/simulation-poster.jpg',quality=92)
 process.stdin.write(im.tobytes())
process.stdin.close()
if process.wait()!=0:raise RuntimeError('ffmpeg failed')
print('Rendered Hyperdrive SVG and 288 video frames / 12 seconds / 1280x720')
