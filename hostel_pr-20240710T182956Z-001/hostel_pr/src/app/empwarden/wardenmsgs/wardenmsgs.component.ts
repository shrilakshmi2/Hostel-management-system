import { Component,Input,ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import {io, Socket} from 'socket.io-client'

@Component({
  selector: 'app-wardenmsgs',
  templateUrl: './wardenmsgs.component.html',
  styleUrls: ['./wardenmsgs.component.css']
})
export class WardenmsgsComponent {
  @Input() obj
  @Output() viewd=new EventEmitter()
  warden=false
  socket:Socket
  metadata={fetched:false,total:0,online:0,event:[],msgs:[],ids:[]}
  events_search={mode:'2',class:{1:'x',2:'Selected_ev',3:'x'},res:[]}
  bradcast=false
  indi={status:false,seg:{status:false,res:[],ele:{id:'',name:'',des:'',email:''}}}
  view_event={status:false,data:{}}
  msgs={mode:'1',res:[],class:{1:'Selected_ev',2:'x'}}
  constructor(private change:ChangeDetectorRef){
    this.socket=io('http://localhost:2400')

  }
  ngOnInit(){
    console.log(this.obj)
    this.loadresources()
    this.socket_ops_incoming()
    this.viewd.emit('done')
  }
  async loadresources(){
    let res=await fetch('http://localhost:2400/warden_prev',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
    let result=await res.json()
    if(result.status=='done')
      this.warden=true
    res=await fetch('http://localhost:2400/msgs_req',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,mode:this.obj.mode})})
     result=await res.json()
    console.log(result)
    if(result.status!='done'){
      appendmsg('Unable to fetch data',2)
      return
    }
    this.metadata.total=result.data.events.length
    this.metadata.event=result.data.events
    this.metadata.msgs=result.data.msgs
    this.metadata.fetched=true
    this.otptimse_msgs()
    if(!this.warden)
    this.changemode_msgs('1')
    this.set_meta_res('2')
    res=await fetch('http://localhost:2400/get_all_emails',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
    result=await res.json()
    console.log(result)
    if(result.status=='done')
      this.metadata.ids=result.data
  }

  socket_ops_incoming(){
    setInterval(async ()=>{
      let res=await fetch('http://localhost:2400/online_info',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
      let result=await res.json()
      this.metadata.online=result.data
    },5000)
    this.socket.on('new_event',(data)=>{
      this.metadata.event.push(data)
    })
    this.socket.on(`${this.obj.id}`,(data)=>{
      if(data.from=='w'){
        this.metadata.msgs['warden'].push(data.data)
        appendmsg('new message from warden',1)
        this.changemode_msgs('1')
      }
      else{
        this.metadata.msgs['management'].push(data.data)
        appendmsg('new message from management',1)
        this.changemode_msgs('2')
      }
      console.log('done')
    })
    this.socket.on('event_cancel',(data)=>{
      for(let i=0;i<this.metadata.event.length;i++){
        if(this.metadata.event[i].id==data.id){
          appendmsg('One event canceled',2)
          this.metadata.event.splice(i,1)
          break
        }
      }
    })
  }
  change_mode(m){
    for(let i of Object.keys(this.events_search.class))
      this.events_search.class[i]='x'
    this.events_search.class[m]='Selected_ev'
    this.events_search.mode=m
    this.set_meta_res(m)
  }
  set_meta_res(m){
    let arr=[]
    for(let i of this.metadata.event){
      let date=new Date()
      let date2=new Date(i.date)
      if(m=='1'){
        if(date>date2){
          arr.push(i)
        }
      }
      else if(m=='2'){
        if(date==date2){
          arr.push(i)
        }
      }
      else{
        if(date<date2){
          arr.push(i)
        }
      }
    }
    if(arr.length==0){
      appendmsg('no suh entries',2)
    }
    this.events_search.res=arr
  }
  search_enets(val){
    if(val=='')return
    let arr=[]
    for(let i of this.events_search.res){
      if(i.title.toLowerCase().includes(val.toLowerCase()))
        arr.push(i)
    }
    if(arr.length==0){
      appendmsg('No sucj events',2)
      return
    }
    this.events_search.res=arr
  }
  reset_event(){
  this.set_meta_res(this.events_search.mode)
  }

  async broadcast(title,des,link,date,ev){
    let ele=ev.currentTarget
    ele.disabled=true
    if(title==''||des==''||date==''){
      appendmsg('Missing Field',2)
      ele.disabled=false
      return
    }
    let date3=new Date()
    let temp=date.split('-')
    let date2=new Date(temp[0],temp[1],temp[2])
    if(date3>date2){
      appendmsg('Check the date',2)
      return
    }
    let res=await fetch('http://localhost:2400/boradcast',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,title:title,des:des,link:link,date:date2.toISOString()})})
    let result=await res.json()
    ele.disabled=false
    if(result.status!='done'){
      appendmsg('Unable to broadcast :(',2)
      return
    }
    appendmsg('Completed',1)
    this.bradcast=false
  }
  showsuggestions(id,name,des,email){
    this.indi.seg.ele.id=id
    this.indi.seg.ele.name=name
    this.indi.seg.ele.des=des
    this.indi.seg.ele.email=email
    let arr=[]
    for(let i of this.metadata.ids){
      if(i['id'].toLowerCase().includes(id.value.toLowerCase()))
        arr.push(i)
    }
    this.indi.seg.res=arr
    this.indi.seg.status=true
    this.change.detectChanges()
    let master=id.getBoundingClientRect()
    let inp=document.getElementById('showsuggestions') as any;
    inp.style=`top:${master.bottom+10}px;left:${master.left+20}px`
  }
  showsuggestions_name(id,name,des,email){
    this.indi.seg.ele.id=id
    this.indi.seg.ele.name=name
    this.indi.seg.ele.des=des
    this.indi.seg.ele.email=email
    let arr=[]
    for(let i of this.metadata.ids){
      if(i['name'].toLowerCase().includes(name.value.toLowerCase()))
        arr.push(i)
    }
    this.indi.seg.res=arr
    this.indi.seg.status=true
    this.change.detectChanges()
    let master=name.getBoundingClientRect()
    let inp=document.getElementById('showsuggestions') as any;
    inp.style=`top:${master.bottom+10}px;left:${master.left+20}px`
  }
  final_indi(item){
    (this.indi.seg.ele.id as any).value=item['id'];
    (this.indi.seg.ele.name as any).value=item['name'];
    (this.indi.seg.ele.des as any).value=item['des'];
    (this.indi.seg.ele.email as any).value=item['e_mail'];
    this.indi.seg.status=false
  }
  async send_msg(id,name,des,email,msg){
    let date=new Date()
    if(id==''||name==''||des==''||email==''||msg==''){
      appendmsg('missing field',2)
      return
    }
    let res=await fetch('http://localhost:2400/senmsg',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,s_id:id,des:des,from:'w',email:email,date:date.toISOString(),msg:msg})})
    let result=await res.json()
    if(result.status!='done'){
      appendmsg('Unable to send message :(',2)
      return
    }
    appendmsg('Message sent',1)
    this.indi.status=false
  }
  view_event_fn(item){
    this.view_event.data=item
    this.view_event.status=true
  }
  cancel_view_event(){
    this.view_event.data={}
    this.view_event.status=false
  }
  reschedule_event(){
    
  }
  async cancel_event(id){
    let res=await fetch('http://localhost:2400/cancel_event',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,e_id:id})})
    let result=await res.json()
    console.log(result)
  }
  changemode_msgs(m){
    for(let i of Object.keys(this.msgs.class))
      this.msgs.class[i]='x'
    this.msgs.class[m]='Selected_ev'
    this.msgs.mode=m
    if(m=='1'){
      this.msgs.res=this.metadata.msgs['warden']
    }
    else{
      this.msgs.res=this.metadata.msgs['management']
    };
    (document.getElementById('container')as any).scroll=document.getElementById('container').scrollHeight
  }
  otptimse_msgs(){
    for(let i in this.metadata.msgs['warden']){
      let date=new Date(this.metadata.msgs['warden'][i]['date'])
      this.metadata.msgs['warden'][i]['time']=`${date.getHours()}:${date.getMinutes()}`
      date.setHours(0,0,0,0)
      this.metadata.msgs['warden'][i]['date']=date.toISOString()
    }
    for(let i in this.metadata.msgs['management']){
      let date=new Date(this.metadata.msgs['management'][i]['date'])
      this.metadata.msgs['management'][i]['time']=`${date.getHours()}:${date.getMinutes()}`
      date.setHours(0,0,0,0)
      this.metadata.msgs['management'][i]['date']=date.toISOString()
    }
  }
  compare_dates(d1,d2){
    if(!d2)return true
    if(d1<d2)return true
    return false
  }
  msg_input(val){
    if(val.value.length!=0&&val.value.length%70==0)
      val.value+='\n'
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