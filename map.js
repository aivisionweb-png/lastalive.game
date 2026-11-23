export class WorldMap{
 constructor(THREE,config){this.T=THREE;this.config=config;this.root=new THREE.Group();this.colliders=[];this.lootSpawns=[]}
 addBox(x,y,z,w,h,d,color,solid=true){const T=this.T,m=new T.MeshStandardMaterial({color,roughness:.82}),o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);o.castShadow=true;o.receiveShadow=true;this.root.add(o);if(solid)this.colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:y,maxY:y+h});return o}
 build(){const T=this.T,s=this.config.world.size;const g=new T.Mesh(new T.PlaneGeometry(s,s),new T.MeshStandardMaterial({color:0x304536,roughness:1}));g.rotation.x=-Math.PI/2;g.receiveShadow=true;this.root.add(g);const water=new T.Mesh(new T.PlaneGeometry(1400,1400),new T.MeshStandardMaterial({color:0x194c55,roughness:.35,metalness:.15}));water.rotation.x=-Math.PI/2;water.position.y=-1.5;this.root.add(water);
  const roads=[[-300,0,600,16],[0,-260,16,520],[0,0,500,14],[0,250,500,14]];for(const [x,z,w,d] of roads)this.addBox(x,.02,z,w,.08,d,0x222827,false);
  const pois=[[-220,-210,0x41515b],[230,-210,0x514a3a],[-220,220,0x465a3d],[230,210,0x3e4b48],[0,0,0x4b5358]];
  for(const [cx,cz,color] of pois){for(let i=0;i<12;i++){const w=12+Math.random()*22,d=12+Math.random()*22,h=5+Math.random()*22;const x=cx+(Math.random()-.5)*100,z=cz+(Math.random()-.5)*80;this.addBox(x,0,z,w,h,d,color);if(Math.random()<.25)this.lootSpawns.push({x,z})}}
  for(let i=0;i<80;i++){const a=Math.random()*Math.PI*2,r=320+Math.random()*110,x=Math.cos(a)*r,z=Math.sin(a)*r;const rock=this.addBox(x,0,z,5+Math.random()*8,2+Math.random()*5,5+Math.random()*8,0x4c554d,true);rock.rotation.y=Math.random()*Math.PI}
  for(let i=0;i<90;i++){const a=Math.random()*Math.PI*2,r=130+Math.random()*280,x=Math.cos(a)*r,z=Math.sin(a)*r;const trunk=this.addBox(x,0,z,.7,4,.7,0x60462e,false);const crown=new T.Mesh(new T.ConeGeometry(3.2,7,7),new T.MeshStandardMaterial({color:0x275337,roughness:1}));crown.position.set(x,7,z);crown.castShadow=true;this.root.add(crown)}
  this.root.position.y=0;return this.root}
 resolve(pos,r){for(const c of this.colliders){if(pos.x>c.minX-r&&pos.x<c.maxX+r&&pos.z>c.minZ-r&&pos.z<c.maxZ+r){const left=Math.abs(pos.x-(c.minX-r)),right=Math.abs(pos.x-(c.maxX+r)),top=Math.abs(pos.z-(c.minZ-r)),bottom=Math.abs(pos.z-(c.maxZ+r));const m=Math.min(left,right,top,bottom);if(m===left)pos.x=c.minX-r;else if(m===right)pos.x=c.maxX+r;else if(m===top)pos.z=c.minZ-r;else pos.z=c.maxZ+r}}}
 validSpawn(p,playerPos,min=80){return Math.hypot(p.x-playerPos.x,p.z-playerPos.z)>min&&Math.abs(p.x)<420&&Math.abs(p.z)<420}
}
