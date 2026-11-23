export class InputController{
 constructor(){this.keys=new Set();this.lookX=0;this.lookY=0;this.fire=false;this.sprint=false;this.jump=false;this.crouch=false;this.joystick={x:0,y:0};this.listeners=[];this.mobile=matchMedia("(max-width:700px)").matches}
 bind(){
  addEventListener("keydown",e=>{this.keys.add(e.code);if(e.code==="Space")this.jump=true;if(e.code.startsWith("Arrow"))e.preventDefault()},{passive:false});
  addEventListener("keyup",e=>this.keys.delete(e.code));
  addEventListener("mousedown",e=>{if(e.button===0)this.fire=true});addEventListener("mouseup",e=>{if(e.button===0)this.fire=false});
  addEventListener("mousemove",e=>{if(document.pointerLockElement){this.lookX+=e.movementX;this.lookY+=e.movementY}});
  const look=document.getElementById("touchLook");
  if(look){let last=null;look.addEventListener("pointerdown",e=>{last={x:e.clientX,y:e.clientY};look.setPointerCapture(e.pointerId)});look.addEventListener("pointermove",e=>{if(!last)return;this.lookX+=(e.clientX-last.x)*1.8;this.lookY+=(e.clientY-last.y)*1.8;last={x:e.clientX,y:e.clientY}});look.addEventListener("pointerup",()=>last=null);look.addEventListener("pointercancel",()=>last=null)}
  const joy=document.getElementById("joystick"),stick=document.getElementById("joystickStick");
  if(joy){const move=e=>{const r=joy.getBoundingClientRect();let x=(e.clientX-(r.left+r.width/2))/(r.width/2),y=(e.clientY-(r.top+r.height/2))/(r.height/2);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}this.joystick={x,y};stick.style.transform=`translate(${x*32}px,${y*32}px)`};const end=()=>{this.joystick={x:0,y:0};stick.style.transform=""};joy.addEventListener("pointerdown",e=>{joy.setPointerCapture(e.pointerId);move(e)});joy.addEventListener("pointermove",move);joy.addEventListener("pointerup",end);joy.addEventListener("pointercancel",end)}
  const hold=(id,key)=>{const b=document.getElementById(id);if(!b)return;b.addEventListener("pointerdown",e=>{e.preventDefault();this[key]=true});b.addEventListener("pointerup",()=>this[key]=false);b.addEventListener("pointercancel",()=>this[key]=false)};
  hold("fireBtn","fire");hold("sprintBtn","sprint");
  const jump=document.getElementById("jumpBtn");if(jump)jump.addEventListener("pointerdown",()=>this.jump=true);
  const crouch=document.getElementById("crouchBtn");if(crouch)crouch.addEventListener("pointerdown",()=>this.crouch=!this.crouch);
 }
 consumeJump(){const x=this.jump;this.jump=false;return x}
 axis(){let x=0,y=0;if(this.keys.has("KeyA")||this.keys.has("ArrowLeft"))x-=1;if(this.keys.has("KeyD")||this.keys.has("ArrowRight"))x+=1;if(this.keys.has("KeyW")||this.keys.has("ArrowUp"))y+=1;if(this.keys.has("KeyS")||this.keys.has("ArrowDown"))y-=1;x+=this.joystick.x;y-=this.joystick.y;const l=Math.hypot(x,y);return l>1?{x:x/l,y:y/l}:{x,y}}
 takeLook(){const v={x:this.lookX,y:this.lookY};this.lookX=this.lookY=0;return v}
 isSprint(){return this.sprint||this.keys.has("ShiftLeft")||this.keys.has("ShiftRight")}
 isCrouch(){return this.crouch||this.keys.has("ControlLeft")||this.keys.has("KeyC")}
}
