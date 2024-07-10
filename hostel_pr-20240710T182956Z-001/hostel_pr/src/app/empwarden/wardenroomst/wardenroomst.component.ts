import { Component,Input } from '@angular/core';

@Component({
  selector: 'app-wardenroomst',
  templateUrl: './wardenroomst.component.html',
  styleUrls: ['./wardenroomst.component.css']
})
export class WardenroomstComponent {
  @Input() obj
  rooms_table={fetched:false,total:0,avail:0,logs:[]}
  conformation={status:false,msg:'',room_no:''}
  search={mode:'1',class:{1:'selected_for_search_rst',2:'xxxx',3:'xxxx'},cur_logs:[]}
  constructor(){}
  ngOnInit(){
    this.loadresources()
  }
  async loadresources(){
    this.rooms_table={fetched:false,total:0,avail:0,logs:[]}
    let res=await fetch('http://localhost:2400/rooms_status',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,mode:'emp'})})
    let result=await res.json()
    if(result.status!='done'){
      return
    }
    this.rooms_table.fetched=true
    this.rooms_table.total=result.meta.length
    for(let i of result.meta){
      let obj={room_no:i.room_number,other:{status:i.room_status,mem:[]}}
      if(i.room_status=='available')
        this.rooms_table.avail++
      this.rooms_table.logs.push(obj)
    }

    for(let i of result.info){
      for(let j in this.rooms_table.logs){
        if(this.rooms_table.logs[j].room_no==i.room_no){
          this.rooms_table.logs[j]['other']['mem'].push(i.name)
        }
      }
    }
    this.search.cur_logs=this.rooms_table.logs
    //
  }
  async blockroom(no){
    let res=await fetch('http://localhost:2400/rom_canbe_allocated?',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,room:no})})
    let result=await res.json()
    if(result.status!='done'){
      this.conformation.msg='The rooms for students can not be allocated'
      this.conformation.status=true
      return
    }
    this.conformation.room_no=no
    this.blockroom_final()
  }


  async blockroom_final(){
    let res=await fetch('http://localhost:2400/rooms_status_block',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,room:this.conformation.room_no})})
    let result=await res.json()
    this.conformation.msg=''
    this.conformation.status=false
    this.conformation.room_no=''
    if(result.status!='done'){
      appendmsg('unable to block :(',2)
      return
    }
    appendmsg('Blocked',1)
    this.loadresources()
  }
  
  blockroom_cancel(){
    this.conformation.msg=''
    this.conformation.status=false
    this.conformation.room_no=''
  }

  async unbloack_room(no){
    let res=await fetch('http://localhost:2400/rooms_status_unblock',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,room:no})})
    let result=await res.json()
    if(result.status!='done'){
      appendmsg('Unable to unblock :(',2)
      return
    }
    appendmsg('Unblocked successfully',1)
    this.loadresources()
  } 
  search_inrooms(val){
    if(val=='')return
    let arr=[]
    for(let i of this.search.cur_logs){
      if(this.search.mode=='1'){
        if(i.room_no==val){
          arr.push(i)
        }
      }
      if(this.search.mode=='2'){
        for(let j of i.other.mem){
          if(j.toLowerCase().includes(val.toLowerCase()))
            arr.push(i)
        }
      }
      else{
        if(i.other.status==val)
          arr.push(i)
      }
    }
    if(arr.length==0){
      appendmsg('no entries found',2)
      return
    }
    this.search.cur_logs=arr
  }
  reset_search(){
    this.search.cur_logs=this.rooms_table.logs
  }
  chnage_search_mode(m){
    for(let i of Object.keys(this.search.class)){
      this.search.class[i]='xxxx'
    }
    this.search.class[m]='selected_for_search_rst'
    this.search.mode=m
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