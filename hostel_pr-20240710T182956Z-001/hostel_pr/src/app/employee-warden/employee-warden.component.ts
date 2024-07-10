import { ChangeDetectorRef, Component } from '@angular/core';
import {ActivatedRoute,Router} from '@angular/router'
import {io,Socket} from'socket.io-client'
import { from } from 'rxjs';

@Component({
  selector: 'app-employee-warden',
  templateUrl: './employee-warden.component.html',
  styleUrls: ['./employee-warden.component.css']
})
export class EmployeeWardenComponent {
   emp_id=''
   emp_pr=''
   unq=''
   msg_count=0
   mode={mode:'1',1:'warden_navbar_selected',2:'x',3:'x',4:'x',5:'x',6:'x',7:'x'}
   socket:Socket
   feedback_list={fetched:false,list:[]}
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
    // logoutlistner(this.emp_id,this.unq)
  }
  async validatelogin(){
    let res=await fetch('http://localhost:2400/loginvalide',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.emp_id,unq:this.unq})})
    let result=await res.text()
    if(result!='loggedin'){
      this.router.navigate([''])
      return
    }
    this.getfeedback()
  }
  async getfeedback(){
    this.feedback_list.list=[]
    let res=await fetch('http://localhost:2400/getfeedback',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.emp_id,unq:this.unq})})
    let result=await res.json()
    console.log(result)
    if(result.status!='done'){
      return
    }
    this.feedback_list.fetched=true
    result.data.feedback.sort(this.compareDates)
    result.data.feedback[0]['dt_show']=true
    let fd=result.data.feedback
    this.append_feed(fd)
    console.log(fd)
  }
  append_feed(fd){
    for(let i=0;i<fd.length;i++){
      let date=new Date(fd[i].date)
      fd[i]['time']=`${date.getHours()}:${date.getMinutes()}`
      date.setHours(0)
      date.setMinutes(0)
      date.setSeconds(0)
      date.setMilliseconds(0)
      if(i!=fd.length-1){
        let date2=new Date(fd[i+1].date)
        date2.setHours(0)
        date2.setMinutes(0)
        date2.setSeconds(0)
        date2.setMilliseconds(0)
        if(date2>date)
          fd[i+1]['dt_show']=true
      }
      this.feedback_list.list.push(fd[i])
    }
  }
  compareDates = (a, b) => {
    // Convert strings to Date objects
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    // Compare dates
    if (dateA < dateB) {
        return -1;
    }
    if (dateA > dateB) {
        return 1;
    }
    return 0;
};
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
    this.socket.on('new_feedback',(data)=>{
      this.getfeedback()
      appendmsg('New feedback recieved',1)
    })
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

 function logoutlistner(id,unq){
  window.addEventListener('beforeunload',async ()=>{
    let res=await fetch("http://localhost:2400/logout",{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:id,unq:unq})})
  })
  
}

function appendmsg(msg,mode){
  let master=document.createElement("div") as any;
  master.className='showfloatingmsg'
  master.innerHTML=`<p>${msg}</p>`
  if(mode==1)master.getElementsByTagName('p')[0].style=`color: rgb(17, 124, 17); background-color: rgb(96, 124, 96);`
  else master.getElementsByTagName('p')[0].style=`background-color:rgb(181, 127, 127);  color: rgb(182, 29, 29);`
  document.body.append(master)
  setTimeout(() => {
    master.remove()
  }, 5000);
}