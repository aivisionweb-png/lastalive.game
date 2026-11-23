export class NetworkClient{
 constructor(config,ui){this.config=config;this.ui=ui;this.socket=null;this.connected=false;this.remote=new Map()}
 connect(name){if(!this.config.network.enabled||!window.io)return false;try{this.socket=window.io(this.config.network.url,{transports:["websocket"]});this.socket.on("connect",()=>{this.connected=true;this.socket.emit("create-room",{name})});this.socket.on("disconnect",()=>this.connected=false);return true}catch{return false}}
 sendInput(state){if(this.connected)this.socket.emit("input",state)}
 sendShot(data){if(this.connected)this.socket.emit("shoot",data)}
}
