import { Component } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { io,Socket } from 'socket.io-client';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent {
  emp_id=''
  emp_pr=''
  unq=''
  msg_count=0
  mode={mode:'1',1:'warden_navbar_selected',2:'x',3:'x',4:'x',5:'x',6:'x',7:'x'}
  socket:Socket
  constructor(private routes:ActivatedRoute,private router:Router){
   this.socket=io('http://localhost:2400')
  }
 ngOnInit(){
   console.log(window.history.state)
   this.unq=window.history.state.data
   this.emp_pr=window.history.state.pr
   this.emp_id=this.routes.snapshot.params['id']
   setInterval(async ()=>{
    let res=await fetch('http://localhost:2400/loginvalidationtimer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:this.emp_id})})
    let result=await res.text()
   },900000)
   this.socket.emit('connected_user',{id:this.emp_id})
   window.onbeforeunload=()=>{
     this.socket.emit('disconnedted_user',{id:this.emp_id})
   }
   this.set_socket_incoming()
   this.validatelogin()
   logoutlistner(this.emp_id,this.unq)
 }
 async validatelogin(){
    let reload=await reload_buffer(this.emp_id)
    if(reload.status){
      this.unq=reload.data
    }
   let res=await fetch('http://localhost:2400/loginvalide',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({id:this.emp_id,unq:this.unq})})
   let result=await res.text()
   if(result!='loggedin'){
     this.router.navigate([''])
     return
   }
 }
  loadresources(m,ev){
   this.mode.mode=m
   for(let i=1;i<=7;i++){
     this.mode[`${i}`]='x'
   }
   this.mode[m]='warden_navbar_selected'
 }
 async logout(){
   let res=await fetch("http://localhost:2400/logout",{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({id:this.emp_id,unq:this.unq})})
 console.log(await res.text())
   this.router.navigate([''])
 }
 set_socket_incoming(){
   this.socket.on("new_event",(data)=>{
     this.msg_count++
   })
 }
 Viewd(ev){
   this.msg_count=0
   console.log('viewd')
 }
}


async function reload_buffer(id){
  let res=await fetch('http://localhost:2400/reload_valid',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({id:id})})
   let result=await res.json()
   if(result.status)
    return {status:true,data:result.data}
  return {status:false}
}

function logoutlistner(id,unq){
  window.onbeforeunload=async ()=>{
    let res=await fetch('http://localhost:2400/reload_done',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({id:id,unq:unq})})
  }
}