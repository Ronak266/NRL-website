// Deterministic CPU studio renderer. No external models, video APIs or paid services.
#include <algorithm>
#include <cmath>
#include <fstream>
#include <iostream>
#include <vector>
#include <string>
#include <omp.h>
using namespace std;
struct V{double x=0,y=0,z=0; V operator+(V b)const{return{x+b.x,y+b.y,z+b.z};} V operator-(V b)const{return{x-b.x,y-b.y,z-b.z};} V operator*(double s)const{return{x*s,y*s,z*s};} V operator*(V b)const{return{x*b.x,y*b.y,z*b.z};} double operator[](int i)const{return i==0?x:i==1?y:z;}};
double dot(V a,V b){return a.x*b.x+a.y*b.y+a.z*b.z;}V cross(V a,V b){return{a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x};}V norm(V a){return a*(1/sqrt(max(1e-20,dot(a,a))));}V mix(V a,V b,double t){return a*(1-t)+b*t;}double sat(double a){return max(0.,min(1.,a));}
struct Tri{V a,b,c,n,color,move,na,nb,nc;double delay,end; V pivot; int axis;int mat;};vector<Tri>original,tris;
struct Node{V lo,hi;int left=-1,right=-1,start=0,count=0;};vector<Node>nodes;vector<int>ids;
int build(int start,int count){int id=nodes.size();nodes.push_back({});V lo{1e9,1e9,1e9},hi{-1e9,-1e9,-1e9};for(int i=start;i<start+count;i++)for(V p:{tris[ids[i]].a,tris[ids[i]].b,tris[ids[i]].c}){lo={min(lo.x,p.x),min(lo.y,p.y),min(lo.z,p.z)};hi={max(hi.x,p.x),max(hi.y,p.y),max(hi.z,p.z)};}
 nodes[id].lo=lo;nodes[id].hi=hi;nodes[id].start=start;nodes[id].count=count;if(count<=6)return id;V d=hi-lo;int axis=d.x>d.y?(d.x>d.z?0:2):(d.y>d.z?1:2);int mid=start+count/2;nth_element(ids.begin()+start,ids.begin()+mid,ids.begin()+start+count,[&](int a,int b){return (tris[a].a[axis]+tris[a].b[axis]+tris[a].c[axis])<(tris[b].a[axis]+tris[b].b[axis]+tris[b].c[axis]);});int left=build(start,mid-start),right=build(mid,start+count-mid);nodes[id].left=left;nodes[id].right=right;return id;}
bool boxhit(Node n,V o,V d,double limit){double low=0,high=limit;for(int i=0;i<3;i++){if(abs(d[i])<1e-10){if(o[i]<n.lo[i]||o[i]>n.hi[i])return false;continue;}double a=(n.lo[i]-o[i])/d[i],b=(n.hi[i]-o[i])/d[i];if(a>b)swap(a,b);low=max(low,a);high=min(high,b);if(high<low)return false;}return true;}
int hit(V o,V d,double& distance,bool shadow=false){int found=-1;int stack[128],top=0;stack[top++]=0;while(top){Node n=nodes[stack[--top]];if(!boxhit(n,o,d,distance))continue;if(n.left>=0){stack[top++]=n.left;stack[top++]=n.right;continue;}for(int i=n.start;i<n.start+n.count;i++){int k=ids[i];auto t=tris[k];if(shadow&&t.mat==2)continue;V e=t.b-t.a,f=t.c-t.a,p=cross(d,f);double det=dot(e,p);if(abs(det)<1e-9)continue;double inv=1/det;V s=o-t.a;double u=dot(s,p)*inv;if(u<0||u>1)continue;V q=cross(s,e);double v=dot(d,q)*inv;if(v<0||u+v>1)continue;double dist=dot(f,q)*inv;if(dist>.002&&dist<distance){distance=dist;found=k;if(shadow)return k;}}}return found;}
V environment(V d){double up=sat(d.y*.5+.5);V base=mix({.025,.022,.03},{.16,.18,.22},up);double white=pow(max(0.,dot(d,norm({-3,6,4}))),28);double strip=pow(max(0.,dot(d,norm({5,3,0}))),50);double red=pow(max(0.,dot(d,norm({3,3,-4}))),16);return base+V{3.2,3.3,3.5}*white+V{2,2,2}*strip+V{.8,.025,.07}*red;}
V shade(V o,V d,int depth,unsigned seed){double distance=1e6;int idx=hit(o,d,distance);double floorT=d.y<-.0001?(-.035-o.y)/d.y:1e7;bool floor=floorT>.002&&floorT<distance;if(idx<0&&!floor)return environment(d)*.35;if(floor)distance=floorT;V p=o+d*distance,n=floor?V{0,1,0}:tris[idx].n;if(!floor){auto &t=tris[idx];V a=t.b-t.a,b=t.c-t.a,c=p-t.a;double aa=dot(a,a),ab=dot(a,b),bb=dot(b,b),ca=dot(c,a),cb=dot(c,b),den=aa*bb-ab*ab;if(abs(den)>1e-15){double u=(bb*ca-ab*cb)/den,v=(aa*cb-ab*ca)/den;n=norm(t.na*(1-u-v)+t.nb*u+t.nc*v);}}if(dot(n,d)>0)n=n*-1;int mat=floor?4:tris[idx].mat;V albedo=floor?V{.025,.025,.03}:tris[idx].color;double metallic=mat==1?.88:0,rough=mat==0?.8:mat==1?.25:.4;
 V result=albedo*(.16+.18*sat(n.y));
 // Two finite studio softboxes, deterministic samples for clean temporal behaviour.
 for(int l=0;l<2;l++){
  V lp=l==0?V{-3.5,7,5}:V{5,4,-3};lp.x+=((seed%7)/6.-.5)*.45;lp.z+=(((seed/7)%7)/6.-.5)*.45;V ld=norm(lp-p);double limit=sqrt(dot(lp-p,lp-p));int blocker=hit(p+n*.004,ld,limit,true);double visibility=blocker<0?1:.08;double diffuse=max(0.,dot(n,ld));V halfV=norm(ld-d);double spec=pow(max(0.,dot(n,halfV)),mat==1?75:25)*(mat==0?.08:.65);V light=l==0?V{1.9,1.85,1.8}:V{.24,.025,.045};result=result+(albedo*(diffuse*(1-metallic*.65))+mix(V{.05,.05,.05},albedo,metallic)*spec*3)*light*visibility;
 }
 V reflection=norm(d-n*(2*dot(d,n)));double fresnel=.04+.96*pow(1-max(0.,-dot(n,d)),5);
 if(mat==2){if(depth>=5)return environment(d);V through=shade(p+d*.006,d,depth+1,seed);return through*.88+environment(reflection)*(.09+fresnel*.3);}
 if(mat==1)result=result+environment(reflection)*albedo*(.45+fresnel*.4);
 if(floor)result=result+environment(reflection)*.012;
 // Near-contact occlusion makes fasteners, wiring and seams sit inside the assembly.
 if(!floor&&depth==0){V ao=norm(n+V{.31,.63,.21});double limit=.3;if(hit(p+n*.006,ao,limit,true)>=0)result=result*.65;}
 return result;
}
int main(int argc,char**argv){if(argc<5)return 2;ifstream in(argv[1]);int count=0;if(!(in>>count)||count<1)return 3;for(int i=0;i<count;i++){Tri t;in>>t.a.x>>t.a.y>>t.a.z>>t.b.x>>t.b.y>>t.b.z>>t.c.x>>t.c.y>>t.c.z>>t.color.x>>t.color.y>>t.color.z>>t.move.x>>t.move.y>>t.move.z>>t.delay>>t.mat>>t.na.x>>t.na.y>>t.na.z>>t.nb.x>>t.nb.y>>t.nb.z>>t.nc.x>>t.nc.y>>t.nc.z>>t.end>>t.pivot.x>>t.pivot.y>>t.pivot.z>>t.axis;t.n=norm(cross(t.b-t.a,t.c-t.a));original.push_back(t);}int start=stoi(argv[3]),end=stoi(argv[4]);const int W=argc>5?stoi(argv[5]):960,H=argc>6?stoi(argv[6]):540,FPS=24;omp_set_num_threads(8);
 for(int frame=start;frame<end;frame++){double time=frame/double(FPS),sep=time<6?sat((time-1)/5.):time<12?1:1-sat((time-12)/5.);double yaw=.55;
 int held=time<1?0:(time>=6&&time<12?144:(time>=17?0:-1));
 if(held>=0&&held!=frame){char src[1024],dest[1024];snprintf(src,sizeof(src),"%s/%04d.ppm",argv[2],held);snprintf(dest,sizeof(dest),"%s/%04d.ppm",argv[2],frame);ifstream cached(src,ios::binary);if(cached.good()){ofstream copy(dest,ios::binary);copy<<cached.rdbuf();cerr<<"Frame "<<frame<<" completed (held pose)\n";continue;}}
 tris=original;V lo{1e9,1e9,1e9},hi{-1e9,-1e9,-1e9};for(auto&t:tris){double a=sat((sep-t.delay)/(t.end-t.delay));a=a*a*(3-2*a);V m=t.move*a;
 if(t.axis>=0){double angle=a*8*3.141592653589793;auto rotate=[&](V v){double c=cos(angle),s=sin(angle);return t.axis==0?V{v.x,v.y*c-v.z*s,v.y*s+v.z*c}:t.axis==1?V{v.x*c+v.z*s,v.y,-v.x*s+v.z*c}:V{v.x*c-v.y*s,v.x*s+v.y*c,v.z};};t.a=rotate(t.a-t.pivot)+t.pivot;t.b=rotate(t.b-t.pivot)+t.pivot;t.c=rotate(t.c-t.pivot)+t.pivot;t.na=rotate(t.na);t.nb=rotate(t.nb);t.nc=rotate(t.nc);t.n=rotate(t.n);}
 t.a=t.a+m;t.b=t.b+m;t.c=t.c+m;for(V p:{t.a,t.b,t.c}){lo={min(lo.x,p.x),min(lo.y,p.y),min(lo.z,p.z)};hi={max(hi.x,p.x),max(hi.y,p.y),max(hi.z,p.z)};}}nodes.clear();ids.resize(tris.size());for(int i=0;i<(int)ids.size();i++)ids[i]=i;build(0,ids.size());lo={1e9,1e9,1e9};hi={-1e9,-1e9,-1e9};for(const auto&t:original)for(V q:{t.a,t.b,t.c})for(V p:{q,q+t.move}){lo={min(lo.x,p.x),min(lo.y,p.y),min(lo.z,p.z)};hi={max(hi.x,p.x),max(hi.y,p.y),max(hi.z,p.z)};}V target=(lo+hi)*.5;double dist=0;V near=norm(V{sin(yaw)*.84,.54,cos(yaw)*.84}),fitRight=norm(cross(V{0,1,0},near)),fitUp=cross(near,fitRight);for(double x:{lo.x,hi.x})for(double y:{lo.y,hi.y})for(double z:{lo.z,hi.z}){V p=V{x,y,z}-target;dist=max(dist,dot(p,near)+1.08*max(abs(dot(p,fitRight))/(double(W)/H*.32),abs(dot(p,fitUp))/.32));}V eye=target+V{sin(yaw)*.84,.54,cos(yaw)*.84}*dist;V forward=norm(target-eye),right=norm(cross(forward,{0,1,0})),up=cross(right,forward);vector<unsigned char>pixels(W*H*3);
 #pragma omp parallel for schedule(dynamic,4)
 for(int y=0;y<H;y++)for(int x=0;x<W;x++){V color{};for(int s=0;s<2;s++){double dx=s?.75:.25,dy=s?.25:.75;V d=norm(forward+right*((2*(x+dx)/W-1)*double(W)/H*.32)+up*((1-2*(y+dy)/H)*.32));color=color+shade(eye,d,0,(s*26699)%100003)*.5;}for(int c=0;c<3;c++){double a=color[c]*1.1;a=(a*(2.51*a+.03))/(a*(2.43*a+.59)+.14);pixels[(y*W+x)*3+c]=round(255*pow(sat(a),1/2.2));}}
 char name[1024];snprintf(name,sizeof(name),"%s/%04d.ppm",argv[2],frame);ofstream out(name,ios::binary);out<<"P6\n"<<W<<" "<<H<<"\n255\n";out.write((char*)pixels.data(),pixels.size());cerr<<"Frame "<<frame<<" completed\n";
 }
}
