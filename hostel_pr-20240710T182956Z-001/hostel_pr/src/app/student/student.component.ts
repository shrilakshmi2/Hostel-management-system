import { ChangeDetectorRef, Component } from '@angular/core';
import {ActivatedRoute,Router} from '@angular/router'
import { io,Socket } from 'socket.io-client';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css']
})
export class StudentComponent {
  studentid=''
  unq=''
  emp_pr=''
  warden=false
  loggedin=false
  mode={mode:'1',1:'warden_navbar_selected',2:'x',3:'x',4:'x',5:'x',6:'x',7:'x'}
   socket:Socket
   msg_count=0
  feedback=false
  drag=false
  hold=false
  positionX=window.innerWidth-120
  positionY=window.innerHeight-80
  feedback_cancel_ev=(e)=>{
    console.log(e.target.closest('#feedback_outer'))
    if(e.target.closest('#feedback_inner')==null&&e.target.closest('#feedback')==null){
      this.feedback_cancel()
      document.removeEventListener('click',this.feedback_cancel_ev)
    }
  }
  constructor(private routes:ActivatedRoute,private router:Router,private change:ChangeDetectorRef){
    this.socket=io('http://localhost:2400')
  }
  ngOnInit(){
    this.unq=window.history.state.data
    this.emp_pr=window.history.state.pr
    this.studentid=this.routes.snapshot.params['id']
    setInterval(async ()=>{
     let res=await fetch('http://localhost:2400/loginvalidationtimer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:this.studentid})})
     let result=await res.text()
    },900000)
    this.socket.emit('connected_user',{id:this.studentid})
    window.onbeforeunload=()=>{
      this.socket.emit('disconnedted_user',{id:this.studentid})
    }
    console.log(this.unq)
    this.validatelogin(this.unq)
    this.set_incoming_socket()
    // logoutlistner(this.studentid,this.unq)
  }
  set_incoming_socket(){
    this.socket.on("new_event",(data)=>{
      this.msg_count++
    })
    this.socket.on(`${this.studentid}`,(data)=>{
      this.msg_count++
    })
  }
  
  async  validatelogin(id){
    // let reload=await reload_buffer(this.studentid)
    // if(reload.status){
    //   console.log(reload.data)
    //   this.unq=reload.data
    // }
    let res=await fetch('http://localhost:2400/loginvalide',{method:'post',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.studentid,unq:this.unq})})
    let result=await res.text()
    console.log(result)
  if(result=='loggedin'){
    this.loggedin=true
    // this.router.navigate(['login','student',this.studentid,'home'])
    return
  }
  this.router.navigate([''])
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
  body:JSON.stringify({id:this.studentid,unq:this.unq})})
  console.log(await res.text())
    this.router.navigate([''])
  }
  Viewd(ev){
    this.msg_count=0
    console.log('viewd')
  }
  feedback_cancel(){
    this.feedback=false
  }
  add_feedback(ev){
    let ele=ev.currentTarget
    document.addEventListener('click',this.feedback_cancel_ev)
    this.feedback=true
    this.change.detectChanges()
  }
  async submit_feedback(val){
    if(val=='')return
    let res=await fetch("http://localhost:2400/feed_backs_submit",{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.studentid,unq:this.unq,feed:val})})
    let result=await res.json()
    if(result.status!='done'){
      appendmsg('SOmething went wrong :(',2)
      return
    }
    appendmsg('Feedback send',1)
    this.feedback_cancel()
  }
  mouse_up(){
    this.drag=false;
    (document.body as any).style='user-select: auto;'
  }
  dblclick_done(){
    this.drag=true;
    (document.body as any).style='user-select: none;'
  }
  movement(ev){
    if (this.drag) {
      this.positionX = ev.clientX;
      this.positionY = ev.clientY;
    }
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

function appendmsg(msg,mode){
  let master=document.createElement("div") as any;
  master.className='showfloatingmsg'
  master.innerHTML=`<p>${msg}</p>`
  if(mode==1)master.getElementsByTagName('p')[0].style=`    color: rgb(17, 124, 17); background-color: rgb(96, 124, 96);`
  else master.getElementsByTagName('p')[0].style=`background-color:rgb(181, 127, 127);  color: rgb(182, 29, 29);`
  document.body.append(master)
  setTimeout(() => {
    master.remove()
  }, 5000);
}
