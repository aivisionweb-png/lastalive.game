export const CONFIG={
  world:{size:900,groundY:0,botCount:14},
  player:{height:1.75,radius:.42,walkSpeed:6.5,sprintSpeed:10.8,crouchSpeed:3.2,jump:8.5,gravity:24,maxHP:100,maxArmor:100},
  zone:{startRadius:330,phases:[{wait:18,target:260,duration:22,damage:1},{wait:12,target:195,duration:20,damage:2},{wait:10,target:125,duration:18,damage:4},{wait:8,target:65,duration:16,damage:7}]},
  bots:{detect:150,shootRange:75,shootCooldown:1.0,speed:2.2},
  debug:{enabled:false},
  network:{enabled:false,url:"https://lastalive-game.onrender.com"}
};

export const WEAPONS=[
 {id:"ar",name:"AR-01",damage:25,rate:105,mag:30,reserve:120,spread:.012,range:240,reload:.9},
 {id:"pistol",name:"PX-9",damage:34,rate:260,mag:12,reserve:72,spread:.018,range:180,reload:.75},
 {id:"shotgun",name:"M-12",damage:12,rate:680,mag:6,reserve:36,spread:.095,pellets:8,range:85,reload:1.15}
];
