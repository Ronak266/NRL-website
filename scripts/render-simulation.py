"""Render the shared concept model into a reproducible, silent 720p MP4."""
import json, math, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
parts=json.loads((ROOT/'assets/robot.json').read_text())
W,H,FPS=1280,720,24
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',15)
big=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',32)
faces=[([0,1,3,2],.38),([4,6,7,5],1.12),([0,4,5,1],.7),([2,3,7,6],1.35),([0,2,6,4],.65),([1,5,7,3],.9)]
def rotate(p,a):
 x,y,z=p;return x*math.cos(a)+z*math.sin(a),y,-x*math.sin(a)+z*math.cos(a)
def project(p,a):
 x,y,z=rotate(p,a);z=-z;y-=1.9
 cy=math.cos(.18);sy=math.sin(.18);y,z=y*cy-z*sy,y*sy+z*cy
 scale=940/(8+z)
 return (W/2+x*scale,H*.51-y*scale,z)
process=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'assets/forge-simulation.mp4')],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
for frame in range(12*FPS):
 t=frame/FPS;phase=min(2,int(t/4));a=-.55+t*.28
 im=Image.new('RGB',(W,H),(15,20,23));d=ImageDraw.Draw(im)
 # Perspective arena floor and orbit rings.
 for j in range(-8,9):
  for ends in [((j,-.13,-8),(j,-.13,8)),((-8,-.13,j),(8,-.13,j))]:
   points=[project(p,a)[:2] for p in ends];d.line(points,fill=(30,43,48),width=1)
 for radius,col in [(2.2,(100,61,41)),(2.8,(48,57,59))]:
  ring=[project((radius*math.cos(v*math.tau/100),0,radius*math.sin(v*math.tau/100)),a)[:2] for v in range(101)]
  d.line(ring,fill=col,width=2)
 polys=[]
 assembly=max(0,1-t/3.8) if phase==0 else 0
 for i,part in enumerate(parts):
  x,y,z=part['p'];sx,sy,sz=part['s'];side=1 if x>=0 else -1
  amount=assembly*(1+.15*part['g']);x+=side*amount*.9;y+=amount*(1.3 if part['g']==2 else .15);z+=(1 if i%2 else -1)*amount*.5
  if phase==2:
   wave=math.sin((t-8)*4)
   if abs(x)>.7:y+=wave*.06
   if y<1.6 and abs(x)>.2:z+=math.sin((t-8)*4+(0 if x<0 else math.pi))*.1
  verts=[project((x+xx*sx/2,y+yy*sy/2,z+zz*sz/2),a) for zz in [-1,1] for yy in [-1,1] for xx in [-1,1]]
  rgb=tuple(int(part['c'][k:k+2],16) for k in (1,3,5))
  for ids,light in faces:
   v=[verts[k] for k in ids];color=tuple(min(255,int(c*light)) for c in rgb)
   polys.append((sum(p[2] for p in v)/4,[p[:2] for p in v],color))
 for _,v,color in sorted(polys,key=lambda p:p[0],reverse=True):d.polygon(v,fill=color,outline=(105,117,119))
 d.rectangle((35,30,1245,690),outline=(61,72,76))
 d.text((60,52),'TITAN FORGE / MOTION STUDY 001',font=font,fill=(240,237,228))
 d.text((60,90),['01 / ASSEMBLY','02 / ORBIT STUDY','03 / ACTUATOR STUDY'][phase],font=big,fill=(255,109,55))
 d.text((60,624),'CONCEPT VISUALIZATION / NOT COMPETITION FOOTAGE',font=font,fill=(160,174,177))
 d.text((1080,624),f'{t:04.1f} / 12s',font=font,fill=(240,237,228))
 d.line((60,660,1220,660),fill=(51,64,68),width=3);d.line((60,660,60+int(1160*t/12),660),fill=(255,109,55),width=3)
 if frame==96:im.save(ROOT/'assets/simulation-poster.jpg',quality=92)
 process.stdin.write(im.tobytes())
process.stdin.close()
if process.wait()!=0:raise RuntimeError('ffmpeg failed')
print('Rendered 288 frames / 12 seconds / 1280x720')
