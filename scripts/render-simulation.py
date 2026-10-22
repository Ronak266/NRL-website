"""Studio-lit study using the shared photo-referenced mesh; not measured CAD."""
import json,math,subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
parts=json.loads((ROOT/'assets/robot.json').read_text())
W,H,FPS,DURATION=1280,720,30,18
font=ImageFont.truetype(str(ROOT/'assets/dm-sans-regular.ttf'),14)
big=ImageFont.truetype(str(ROOT/'assets/barlow-condensed-bold.ttf'),38)
def project(p,a,w=W,h=H,pitch=.56,distance=8):
 x,y,z=p;xx=x*math.cos(a)+z*math.sin(a);zz=x*math.sin(a)-z*math.cos(a);y-=.78
 yy=y*math.cos(pitch)+zz*math.sin(pitch);zz=-y*math.sin(pitch)+zz*math.cos(pitch)
 scale=min(w*1.15,h*1.8)/max(1,distance+zz)
 return w/2+xx*scale,h*.52-yy*scale,zz

def polygons(separation,a,w=W,h=H,spin=0,travel=0):
 result=[]
 for part in parts:
  delay=part.get('delay',0);t=max(0,min(1,(separation-delay)/(1-delay)));amount=t*t*(3-2*t)
  p=[v+part['explode'][i]*amount for i,v in enumerate(part['p'])];world=[]
  for vertex in part['v']:
   q=[v+p[i] for i,v in enumerate(vertex)]
   if 'wheel' in part:
    center=[v+p[i]-part['p'][i] for i,v in enumerate(part['wheel'])];y=q[1]-center[1];z=q[2]-center[2]
    q[1]=center[1]+y*math.cos(spin)-z*math.sin(spin);q[2]=center[2]+y*math.sin(spin)+z*math.cos(spin)
   q[2]+=travel;world.append(q)
  verts=[project(v,a,w,h,distance=8+separation*9) for v in world]
  rgb=[int(part['c'][k:k+2],16) for k in [1,3,5]]
  for face in part['f']:
   aa,bb,cc=[world[k] for k in face[:3]];u=[bb[i]-aa[i] for i in range(3)];v=[cc[i]-aa[i] for i in range(3)]
   n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];length=math.sqrt(sum(x*x for x in n)) or 1
   diffuse=abs((n[0]*-.4+n[1]*.85+n[2]*.35)/length)
   light=.42+.62*diffuse+(.22*diffuse**14 if part.get('material')=='metal' else 0)
   points=[verts[i] for i in face];color=tuple(min(255,round(c*light)) for c in rgb)
   result.append((sum(v[2] for v in points)/len(points),[v[:2] for v in points],color,part.get('alpha',1),part.get('material','polymer')))
 return sorted(result,key=lambda p:p[0],reverse=True)

def fit(polys,w,h,pad=50):
 points=[v for p in polys for v in p[1]];lo=[min(v[i] for v in points) for i in [0,1]];hi=[max(v[i] for v in points) for i in [0,1]]
 scale=min((w-2*pad)/(hi[0]-lo[0]),(h-2*pad)/(hi[1]-lo[1]));cx=(hi[0]+lo[0])/2;cy=(hi[1]+lo[1])/2
 return [(z,[(w/2+(x-cx)*scale,h/2+(y-cy)*scale) for x,y in pts],c,alpha,mat) for z,pts,c,alpha,mat in polys]

def svg():
 w,h=600,540;lines=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 540" role="img" aria-label="Detailed Hyperdrive prototype"><title>Titan Forge Hyperdrive prototype</title>']
 for _,v,c,alpha,mat in fit(polygons(0,.55,w,h),w,h,55):
  points=' '.join(f'{x:.2f},{y:.2f}' for x,y in v);col='#'+''.join(f'{x:02x}' for x in c)
  lines.append(f'<polygon points="{points}" fill="{col}" fill-opacity="{alpha}" stroke="#738e9e" stroke-opacity=".18" stroke-width=".25"/>')
 lines.append('</svg>');(ROOT/'assets/hyperdrive-robot.svg').write_text('\n'.join(lines))
svg()
S=1.25;RW,RH=int(W*S),int(H*S)
background=Image.new('RGB',(RW,RH));d=ImageDraw.Draw(background)
for y in range(RH):
 t=y/RH;d.line((0,y,RW,y),fill=tuple(round(a*(1-t)+b*t) for a,b in zip((246,250,252),(216,231,240))))
for x in range(0,RW,45):d.line((x,0,x,RH),fill=(218,230,237))
for y in range(0,RH,45):d.line((0,y,RW,y),fill=(218,230,237))
process=subprocess.Popen(['ffmpeg','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'assets/forge-simulation.mp4')],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
for frame in range(DURATION*FPS):
 t=frame/FPS;phase=min(2,int(t/6))
 separation=min(1,t/5.5) if phase==0 else 1 if phase==1 else max(0,1-(t-12)/3.5)
 a=.55+.07*t if phase==0 else .97+(t-6)*.22 if phase==1 else 2.29-(t-12)*.25
 travel=.16*math.sin(max(0,t-15.5)*1.4) if t>15.5 else 0
 im=background.copy();shadow=Image.new('RGBA',im.size);sd=ImageDraw.Draw(shadow)
 sd.ellipse((RW*.22,RH*.66,RW*.78,RH*.86),fill=(34,68,89,round(45-separation*23)));shadow=shadow.filter(ImageFilter.GaussianBlur(24));im.paste(shadow,(0,0),shadow)
 d=ImageDraw.Draw(im,'RGBA')
 for _,v,c,alpha,mat in fit(polygons(separation,a,RW,RH-140*S,spin=-travel/.54,travel=travel),RW,RH-140*S,50*S):
  v=[(x,y+90*S) for x,y in v];d.polygon(v,fill=(*c,round(alpha*255)))
  if mat=='glass':d.line(v+[v[0]],fill=(112,151,171,150),width=1)
 im=im.resize((W,H),Image.Resampling.LANCZOS);d=ImageDraw.Draw(im,'RGBA')
 d.text((34,22),'TITAN FORGE  /  HYPERDRIVE ENGINEERING STUDY',font=font,fill=(47,84,107,255))
 d.text((34,48),['01 / OPEN THE MACHINE','02 / EVERY COMPONENT. EVERY WIRE.','03 / BACK TOGETHER. READY TO MOVE.'][phase],font=big,fill=(24,67,85,255))
 d.rounded_rectangle((1000,25,1246,72),radius=8,fill=(255,255,255,210),outline=(177,202,215,255))
 d.text((1018,40),'147 COMPONENTS / 10 WIRES',font=font,fill=(25,105,108,255))
 d.text((34,666),'PHOTO-REFERENCED / HIDDEN DETAILS APPROXIMATE / SILENT',font=font,fill=(70,99,115,255))
 d.text((1125,666),f'{t:04.1f} / 18s',font=font,fill=(36,79,104,255))
 d.line((34,700,1246,700),fill=(173,198,212,255),width=3);d.line((34,700,34+int(1212*t/DURATION),700),fill=(24,130,125,255),width=3)
 if frame==210:im.save(ROOT/'assets/simulation-poster.jpg',quality=94)
 if frame in [0,165,270,480]:im.save(ROOT/f'dist/study-frame-{frame}.jpg',quality=94)
 process.stdin.write(im.tobytes())
 if frame%90==0:print(f'Rendered {frame}/{DURATION*FPS}',flush=True)
process.stdin.close()
if process.wait()!=0:raise RuntimeError('ffmpeg failed')
print('Rendered studio SVG and 540 video frames / 18 seconds / 1280x720 / 30 fps')
