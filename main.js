import {CONFIG,WEAPONS} from "./config.js";
import {InputController} from "./input.js";
import {WorldMap} from "./map.js";
import {PlayerController} from "./player.js";
import {WeaponSystem} from "./weapons.js";
import {BotManager} from "./bots.js";
import {LootSystem} from "./loot.js";
import {SafeZone} from "./zone.js";
import {AudioSystem} from "./audio.js";
import {UI} from "./ui.js";
import {Minimap} from "./minimap.js";
import {NetworkClient} from "./network.js";
import {MatchState} from "./match.js";
import {DebugTools} from "./debug.js";

const T=window.THREE;if(!T)throw new Error("Three.js failed to load");
const ui=new UI();ui.bind();
let scene,camera,renderer,clock,input,map,player,weapons,bots,loot,zone,audio,network,match,minimap,debug,running=false;

function init(){scene=new T.Scene();scene.background=new T.Color(0x708982);scene.fog=new T.FogExp2(0x344d47,.002);camera=new T.PerspectiveCamera(70,innerWidth/innerHeight,.05,1400);renderer=new T.WebGLRenderer({canvas:document.getElementById("game"),antialias:true,powerPreference:"high-performance"});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;clock=new T.Clock();
 const hemi=new T.HemisphereLight(0xd5eee5,0x203128,2.1);scene.add(hemi);const sun=new T.DirectionalLight(0xffe8c2,3.2);sun.position.set(-180,260,100);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-500;sun.shadow.camera.right=500;sun.shadow.camera.top=500;sun.shadow.camera.bottom=-500;scene.add(sun);
 map=new WorldMap(T,CONFIG);scene.add(map.build());input=new InputController();input.bind();audio=new AudioSystem();player=new PlayerController(T,CONFIG,input,map);scene.add(player.object);ui.scene=scene;weapons=new WeaponSystem(T,WEAPONS,player,ui,audio);bots=new BotManager(T,CONFIG,map,player,null,ui);bots.onAllDead=()=>finish(true);loot=new LootSystem(T,map,player,ui);loot.spawn(30);zone=new SafeZone(T,CONFIG,player,ui);network=new NetworkClient(CONFIG,ui);match=new MatchState(ui);minimap=new Minimap(document.getElementById("minimap"),CONFIG.world.size);debug=new DebugTools(CONFIG,{player,bots,zone,network,restart});bindUI();addEventListener("resize",resize);requestAnimationFrame(loop)}
function bindUI(){document.getElementById("playBtn").onclick=()=>{audio.start();const n=document.getElementById("playerName").value.trim()||"PLAYER";ui.start(n);match.begin();running=true;if(innerWidth>700)document.getElementById("game").requestPointerLock?.();network.connect(n)};document.getElementById("againBtn").onclick=restart;document.getElementById("lobbyBtn").onclick=()=>{location.reload()};addEventListener("keydown",e=>{if(e.code==="KeyR")weapons.reload();if(e.code==="Digit1")weapons.switch(0);if(e.code==="Digit2")weapons.switch(1);if(e.code==="Digit3")weapons.switch(2)});document.getElementById("game").addEventListener("click",()=>{if(running&&innerWidth>700)document.getElementById("game").requestPointerLock?.()})}
function restart(){location.reload()}
function finish(win){if(!running)return;running=false;document.exitPointerLock?.();match.end(win,player.kills,win?1:Math.max(2,bots.alive()+1))}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);if(running){player.update(dt);if(input.fire)weapons.shoot(scene,camera,bots.bots);weapons.update();bots.update(dt);loot.update(dt);zone.update(dt);ui.hp(player.hp);ui.armor(player.armor);ui.alive(bots.alive()+1);minimap.draw(player,bots.bots,zone.radius,loot.items);debug.update(Math.round(1/dt));if(!player.alive)finish(false);if(player.kills+bots.alive()===0)finish(true)}player.cameraUpdate(camera,true);renderer.render(scene,camera)}
init();
