import { Component,ElementRef ,ChangeDetectorRef} from '@angular/core';
import { Router,ActivatedRoute } from '@angular/router';
import { io,Socket } from 'socket.io-client';

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.css'],
  providers:[]
})

export class ManagementComponent {
  loged_in=false
  empadd_profile={pic:'',name:''}
  cancapute=false
  unq=''
  emp_details={}
  emp_keys=[]
  unable_to_load_emp=[]
  mailsendopt={status:false,mail:''}
  rm_emp={serach_cnst:1,list:[],class:{name:'active',mb:'notctive',em:'notactive'},rm:{active:false,emp:'',mail:''}}
  rooms={avail:0,total:0,fetch:true,alter:{new:false,remove:{alter:false,list:[]}}}
  funds={avail:0}

  async submit(id,pass,msg){
    let res=await fetch('http://localhost:2400/managerlogin',{
      method:'POST',
      cache:'no-cache',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        id:id.value,
        pass:pass.value
      })
    })
    let result=await res.text()
    if(result=='err'){
      msg.innerHTML='username/password missmatch'
      return
    }
    if(result=='loggedin'){
      msg.innerHTML='Please log out from the other device'
      return
    }
    this.unq=result
    this.loged_in=true
    this.change.detectChanges()
    this.init_()
  }

  emp_id='management'
   emp_pr=''
   msg_count=0
   mode={mode:'1',1:'warden_navbar_selected',2:'x',3:'x',4:'x',5:'x',6:'x',7:'x'}
   socket:Socket
   constructor(private routes:ActivatedRoute,private router:Router, private change:ChangeDetectorRef){
    this.socket=io('http://localhost:2400')
   }
  init_(){
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
      this.loged_in=false
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

function loadingscreen(m){
  let out=document.createElement('div') as any;
  out.id='loading_main'
  out.style='position:absolute;height:100vh;width:100vw;top:0px;left:0px'
  out.innerHTML=`<div id="loading_inner">
  <img src="/assets/grey-9026_256.gif" alt="">
  </div>`
  if(m==0){
    document.body.append(out)
    return
  }
  document.getElementById('loading_main').remove()
}

