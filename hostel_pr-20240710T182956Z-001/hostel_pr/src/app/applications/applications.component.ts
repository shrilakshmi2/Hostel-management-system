import { Component,ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import {io,Socket} from 'socket.io-client'

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css']
})
export class ApplicationsComponent {
  mode=''
  adhar={pic:'',name:''}
  profile={pic:'',name:''}
  socket:Socket
  application_status=false
  check={isdone:false,obj:{name:'',email:'',ph:'',id:'',msg:''}}
  constructor(private route:ActivatedRoute,private router:Router,private change:ChangeDetectorRef){
    this.socket=io('http://localhost:2400')
  }
  ngOnInit(){
    if(this.route.snapshot.params['id']=='apply'){
      this.mode='apply'
    }
    else if(this.route.snapshot.params['id']=='check'){
      this.mode='check'
    }
    this.change.detectChanges()
   //socket events handler
  }
  upload_adhar(ev){
    let ele=ev.currentTarget
    this.adhar.name=ele.files[0].name
    this.adhar.pic=ele.files[0]
  }
  remove_adhar(){
    this.adhar.name=''
    this.adhar.pic=''
  }
  upload_profile(ev){
    let ele=ev.currentTarget
    this.profile.name=ele.files[0].name
    this.profile.pic=ele.files[0]
  }
  remove_profile(){
    this.profile.name=''
    this.profile.pic=''
    this.socket.emit('hayy',{x:'xxx'})
  }
  async upload_application(msg,ev){
    msg.innerHTML=''
    let ele=ev.currentTarget
    ele.disabled=true
    let inp=document.getElementById('application').getElementsByTagName('input')
    for(let i=0;i<inp.length;i++){
      if(inp[i].type=='text' ||inp[i].type=='number' || inp[i].type=='email'){
        if(inp[i].value==''){
          msg.innerHTML="Missing Field"
          inp[i].focus()
          ele.disabled=false
          return
        }
        if(inp[i].id=='application_personaldetails_adhar'&&inp[i].value.length!=12){
          msg.innerHTML='Invalid adhar number'
          ele.disabled=false
          return
        }
      }
    }
    if(this.adhar.pic=='' || this.profile.pic==""){
      msg.innerHTML="Upload adhar/your photo"
      ele.disabled=false
      return
    }
    let form=new FormData()
    form.append('meta',JSON.stringify(getmetainfo()))
    form.append('adhar',this.adhar.pic)
    form.append('profile_pic',this.profile.pic)
    form.append('address',getadress())
    form.append('college',getcollege())
    let res=await fetch('http://localhost:2400/application_submit',{method:'POST',body:form})
    let result=await res.json()
    ele.disabled=false
    if(result.status=='err'){
      msg.innerHTML='Some error ocuured'
      return
    }
    if(result.status=='mailerr'){
      msg.innerHTML="Unable to send email please check again!"
      return
    }
    //action
    this.reset_application()
    this.application_status=true
  }
  reset_application(){
    let inp=document.getElementById('application').getElementsByTagName('input')
    for(let i=0;i<inp.length;i++){
      inp[0].value=''
    }
    this.profile.name=''
    this.profile.pic=''
    this.adhar.name=''
    this.adhar.pic=''
  }
  async checkstatus(id,ev,msg){
    msg.innerHTML=''
    if(id=='')return
    let ele=ev.currentTarget
    ele.disabled=true
    let res=await fetch('http://localhost:2400/check_appilication_status',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:id})})
  let result=await res.json()
  ele.disabled=false
  if(result.status=='dberr'){
    appendmsg('Some error ocuured! pelase try later',2)
    return
  }
  if(result.status=='none'){
    appendmsg("Invalid application ID",2)
    return
  }
  if(result.status=='rv'){
    this.check.obj.msg='Under review'
    this.check.obj.id=result.data.app_id
    this.check.obj.name=result.data.name
    this.check.obj.ph=result.data.mobile
    this.check.obj.email=result.data.email
    this.check.isdone=true
    return
  }
  if(result.status=='404'){
    this.check.obj.msg='Rejected'
    this.check.obj.id=result.data.app_id
    this.check.obj.name=result.data.name
    this.check.obj.ph=result.data.mobile
    this.check.obj.email=result.data.email
    this.check.isdone=true
    return
  }
  this.check.obj.msg='Accepted'
    this.check.obj.id=result.data.app_id
    this.check.obj.name=result.data.name
    this.check.obj.ph=result.data.mobile
    this.check.obj.email=result.data.email
    this.check.isdone=true
  }
}


function getmetainfo(){
  let obj={}
  obj['name']=(document.getElementById('application_personaldetails_name')as any).value;
  obj['ph']=(document.getElementById('application_personaldetails_mobile')as any).value;
  obj['email']=(document.getElementById('application_personaldetails_email')as any).value;
  obj['gname']=(document.getElementById('application_personaldetails_gname')as any).value;
  obj['adhar']=(document.getElementById('application_personaldetails_adhar')as any).value;
  console.log(obj)
  return obj
}

function getadress(){
  let obj={}
  obj['cl']=(document.getElementById('app_addinp_address_main')as any).value;
  obj['country']=(document.getElementById('app_addinp_address_country')as any).value;
  obj['state']=(document.getElementById('app_addinp_address_state')as any).value;
  obj['dis']=(document.getElementById('emp_addinp_address_dis')as any).value;
  obj['pin']=(document.getElementById('app_addinp_address_pin')as any).value;
  return JSON.stringify(obj)
}
function getcollege(){
  let obj={}
  obj['clg']=(document.getElementById('application_college_cname')as any).value;
  obj['usn']=(document.getElementById('application_college_usn')as any).value;
  return JSON.stringify(obj)
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