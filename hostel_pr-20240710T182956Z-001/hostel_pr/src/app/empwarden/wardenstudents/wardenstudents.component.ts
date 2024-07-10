import { ChangeDetectorRef, Component,Input } from '@angular/core';
import { io,Socket } from 'socket.io-client';
@Component({
  selector: 'app-wardenstudents',
  templateUrl: './wardenstudents.component.html',
  styleUrls: ['./wardenstudents.component.css']
})
export class WardenstudentsComponent {
  @Input() obj
  socket:Socket
  metadata={fetched:false,total:0,in:0,out:0,info:[]}
  meta_search={mode:'2',class:{2:'selected_st_view',1:'x'},logs:[]}
  st_view={status:false,data:{}}
  st_searchs={logs:[],log_mode:'1',fees:[],log_class:{1:'selected_st_view',2:'x'}}
  addstudent={status:false,st_details:{usn:'',name:'',gname:'',gtype:'',ph:'',email:'',adhar:'',cl:'',country:'',state:'',dist:'',pin:'',utr:''}
  ,profile:{pic:'',name:""}
}
  rm_student={status:false,usn:'',name:''}
  change_room={status:false,mode:'ch',class:{ch:'selected_change_room_mode',swp:'xxx'},seachres:{status:false,res:[]},usn:'',name:'',swap_with:{usn:'',name:''}}
  fee_update=false
  constructor(private change:ChangeDetectorRef){
    this.socket=io('http://localhost:2400')
  }
  ngOnInit(){
    this.loadresources()
  }
  async loadresources(){
    let res=await fetch('http://localhost:2400/students_info',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
    let result=await res.json()
    console.log(result)
    if(result.status!='done'){
      appendmsg('Unable to fetch data',2)
      return
    }
    this.metadata.fetched=true
    this.metadata.total=result.data.total
    this.metadata.in=result.data.in
    this.metadata.info=result.data.info
    this.meta_search.logs=this.metadata.info
    this.set_io_ops()
  }
  set_io_ops(){
    this.socket.on('set_io_ops',(data)=>{
      // this.metadata.info['fees'].push(data)
      // this.metadata.info.
    })
  }
  w_st_search_reset(){
    this.meta_search.logs=this.metadata.info
  }

  w_st_search(val){
    if(val=='')return
    let arr=[]
    for(let i of this.meta_search.logs){
      if(this.meta_search.mode=='1'){
        if(i.USN.toLowerCase().includes(val.toLowerCase()))
          arr.push(i)
      }
      else{
        if(i.Name.toLowerCase().includes(val.toLowerCase()))
          arr.push(i)
      }
    }
    if(arr.length==0){
      appendmsg('no entries found',2)
      return
    }
    this.meta_search.logs=arr
  }
  w_st_search_changemode(m){
    if(m=='1'){
      this.meta_search.class['1']='selected_st_view'
      this.meta_search.class['2']='x'
      this.meta_search.mode=m
      return
    }
    this.meta_search.class['2']='selected_st_view'
    this.meta_search.class['1']='x'
    this.meta_search.mode=m
  }


  student_view(item){
    this.st_view.data=item
    this.st_view.status=true
    this.st_searchs.logs=item['logs']
    this.st_searchs.fees=item['fees']
  }
  cancel_st_view(){
    this.st_view.data={}
    this.st_view.status=false
    this.st_searchs.logs=[]
    this.st_searchs.fees=[]
  }

  change_searchmode_st_logs(m,inp:HTMLInputElement){
    if(m=='1'){
      this.st_searchs.log_class[m]='selected_st_view'
      this.st_searchs.log_class['2']='x'
      inp.placeholder='Search here'
    }
    else{
      this.st_searchs.log_class[m]='selected_st_view'
      this.st_searchs.log_class['1']='x'
      inp.placeholder='Search here *format dd-mm-yyyy'
    }
  }
  reset_search_st_logs(){
    this.st_searchs.logs=this.st_view.data['logs']
  }
  search_in_st_logs(val){
    if(val=='')return
    if(this.st_searchs.log_mode=='2'&& !(/^(\d{2}-){2}\d{4}$/.test(val))){
      appendmsg('invalid date format',2)
      return
    }
    let arr=[]
    for(let i of this.st_searchs.logs){
      if(this.st_searchs.log_mode=='1'){
        if(i.state==val)
          arr.push(i)
      }
      else{
        let date=new Date(i.date)
        let temp=val.split('-')
        if(date.getDate()==temp[0]&&date.getMonth()==temp[1]&&date.getFullYear()==temp[2])
          arr.push(i)
      }
    }
    if(arr.length==0){
      appendmsg('no entries found',2)
      return
    }
    this.st_searchs.logs=arr
  }
  reset_in_st_fees(){
    this.st_searchs.fees=this.st_view.data['fees']
  }
  search_in_st_fees(val){
    if(val=='')return
    if(!(/^(\d{2}-){2}\d{4}$/.test(val))){
      appendmsg('invalid date format',2)
      return
    }
    let arr=[]
    for(let i of this.st_searchs.fees){
      let date=new Date(i.date)
      let temp=val.split('-')
      if(date.getDate()==temp[0]&&date.getMonth()+1==temp[1]&&date.getFullYear()==temp[2])
        arr.push(i)
    }
    if(arr.length==0){
      appendmsg('no entries found',2)
      return
    }
    this.st_searchs.fees=arr
  }

  addprofile_studnet_add(ev){
    let pr=ev.currentTarget
    this.addstudent.profile.name=pr.files[0].name
    this.addstudent.profile.pic=pr.files[0]
  }

  async addstudent_final(ele:HTMLDivElement,ev){
    let btn=ev.currentTarget
    btn.disabled=true
    let inp=[]
    for(let i=0;i<ele.getElementsByTagName('input').length;i++){
      if(ele.getElementsByTagName('input')[i].type=='text'||ele.getElementsByTagName('input')[i].type=='number')
        inp.push(ele.getElementsByTagName('input')[i])
    }
    for(let i=0;i<inp.length;i++){
      if(inp[i].type=='text'||inp[i].type=='number'){
        if(inp[i].value==''){
          appendmsg('Missing field',2)
          inp[i].focus()
          btn.disabled=false
          return
      }
      if(inp[i].id=='emp_addinp_adhar'&&inp[i].value.length!=12){
          appendmsg('Invalid adhar number',2)
          inp[i].focus()
          btn.disabled=false
          return
      }
      }
      let arr=Object.keys(this.addstudent.st_details)
      let form=new FormData()
      for(let i in arr){
        this.addstudent.st_details[arr[i]]=inp[i].value
        form.append(arr[i],inp[i].value)
      }
      form.append('profile_pic',this.addstudent.profile.pic)
      form.append('w_id',this.obj.id)
      form.append('w_unq',this.obj.unq)
      let res=await fetch('http://localhost:2400/students_info_addstudent',{method:'POST',body:form})
      let result=await res.json()
      btn.disabled=false
      if(result.status=='dp'){
        appendmsg('duplicate college ID',2)
        return
      }
      if(result.status!='done'){
        appendmsg('Unable to add studnet :(',2)
        return
      }
      appendmsg('Student added successfully :)',1)
      this.loadresources()
    }

  }
  cancel_add_st(){
    for(let i of Object.keys(this.addstudent.st_details)){
      this.addstudent.st_details[i]=''
    }
    this.addstudent.status=false
    this.addstudent.profile.name=''
    this.addstudent.profile.pic=''
  }
  remove_student(usn,name){
    this.rm_student.status=true
    this.rm_student.usn=usn
    this.rm_student.name=name
  }
  cnacel_rm_student(){
    this.rm_student.status=false
    this.rm_student.usn=''
    this.rm_student.name=''
  }
  async remove_student_final(){
    let res=await fetch('http://localhost:2400/students_info_remove',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,usn:this.rm_student.usn})})
    let result=await res.json()
    if(result.status!='done'){
      appendmsg('removed Successfully',1)
      return
    }
    appendmsg('removed Successfully',1)
    this.cnacel_rm_student()
    this.loadresources()
  }
  change_room_fn(item){
    this.change_room.name=item['Name']
    this.change_room.usn=item['USN']
    this.change_room.status=true
  }
  Change_room_cancel(){
    this.change_room.name=''
    this.change_room.usn=''
    this.change_room.status=false
    this.change_room.seachres.res=[]
    this.change_room.seachres.status=false
    this.change_room.swap_with.name=''
    this.change_room.swap_with.usn=''
  }
change_room_mode(m){
  if(m=='1'){
    this.change_room.mode='ch'
    this.change_room.class.ch='selected_change_room_mode'
    this.change_room.class.swp='x'
    return
  }
  this.change_room.mode='swp'
  this.change_room.class.swp='selected_change_room_mode'
  this.change_room.class.ch='x'
}
swap_input_done(ev){
  let inp=ev.currentTarget
  this.change_room.seachres.status=true
  this.change.detectChanges()
  align_res(inp)
  let arr=[]
  for(let i of this.metadata.info){
    if(i['USN'].toLowerCase().includes(inp.value.toLowerCase())){
      arr.push(i)
    }
  }
  this.change_room.seachres.res=arr
}
update_swap_with(item){
  this.change_room.swap_with.usn=item['USN']
  this.change_room.swap_with.name=item['Name']
  this.change_room.seachres.status=false
}
async swap_room_final(){
  let res=await fetch('http://localhost:2400/students_info_swap_room',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,usn1:this.change_room.usn,usn2:this.change_room.swap_with.usn})})
  let result=await res.json()
  if(result.status=='nostudent'){
    appendmsg('something wrong with IDs',2)
    return
  }
  if(result.status!='done'){
    appendmsg('unable to swap :(',2)
    return
  }
  appendmsg('Swap done :)',1)
  this.loadresources()
}

async change_room_finale(rm){
  let res=await fetch('http://localhost:2400/students_info_change_room',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,usn:this.change_room.usn,room:rm})})
  let result=await res.json()
  console.log(result)
  if(result.status=='id'){
    appendmsg('Invalid ID',2)
    return
  }
  if(result.status=='noroom'){
    appendmsg(`there is no room:> ${rm}`,2)
    return
  }
  if(result.status=='room'){
    appendmsg(`This room cannot be allocated`,2)
    return
  }
  if(result.status!='done'){
    appendmsg('Rooms are full :(',2)
    return
  }
  appendmsg("Rooms allocated",1)
  this.loadresources()
}
async update_fee_st(id,p_id){
  if(p_id=='')return
  let date=new Date()
  let res=await fetch('http://localhost:2400/st_update_fee',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,usn:id,p_id:p_id,date:date.toISOString()})})
  let result=await res.json()
}


}


function appendmsg(msg,mode){
  let master=document.createElement("div") as any;
  master.className='showfloatingmsg'
  master.innerHTML=`<p>${msg}</p>`
  if(mode==1)master.getElementsByTagName('p')[0].style=`    color: white; background-color: rgb(96, 124, 96);`
  else master.getElementsByTagName('p')[0].style=`background-color:rgb(181, 127, 127);  color: rgb(182, 29, 29);`
  document.body.append(master)
  setTimeout(() => {
    master.remove()
  }, 5000);
}

// function addevent_swp(ele:HTMLInputElement){
//   document.addEventListener('click',(e)=>{
//     if(e.target.closest('#change_room_swp_res'))
//   })
// }

function align_res(inp){
  let master=inp.getBoundingClientRect()
  let res=document.getElementById('change_room_swp_res')as any;
  res.style=`top:${master.bottom}px;left:${master.left+20}px`
}