import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SocketServiceService {
  private socket:any
  constructor() {
    this.socket=io('http://localhost:2400')
   }
  sendmsg(msg:string,val){
    this.socket.emit(msg,val)
  }
  recievemsg(type:string,cb: (data: any) => void){
    this.socket.on(type,cb)
  }
}
