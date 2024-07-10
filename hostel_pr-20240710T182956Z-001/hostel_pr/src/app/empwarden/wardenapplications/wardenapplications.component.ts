import { style } from '@angular/animations';
import { ChangeDetectorRef, Component,ElementRef,Input,Renderer2 } from '@angular/core';


@Component({
  selector: 'app-wardenapplications',
  templateUrl: './wardenapplications.component.html',
  styleUrls: ['./wardenapplications.component.css']
})
export class WardenapplicationsComponent {
  @Input() obj
  metadata={total:0,acc:0,pending:0,rej:0,info:[],fetched:false}
  metasearch={mode:'1',class:{1:'selected_st_view',2:'xx'},res:[],typeclass:{1:'selected_st_view',2:'xx',3:''},typemode:'1'}
  view={status:false,data:{}}
  view_pic={status:false,src:'',style:''}

  constructor(private renderer:Renderer2,private change:ChangeDetectorRef,private el:ElementRef){}
  ngOnInit(){
    this.loadresources()
  }
  async loadresources(){
    let res=await fetch('http://localhost:2400/req_applications',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
    let result=await res.json()
    console.log(result);
    if(result.status!='done'){
      return
    }
    this.metadata.acc=result.acc
    this.metadata.pending=result.pending
    this.metadata.rej-result.rej
    this.metadata.total=result.total
    this.metadata.info=result.data
    this.metadata.fetched=true
    this.change_search_type('1')
  }
  change_search_type(m){
    for(let i of Object.keys(this.metasearch.typeclass)){
      this.metasearch.typeclass[i]='xx'
    }
    this.metasearch.typeclass[m]='selected_st_view'
    this.metasearch.typemode=m
    let arr=[]
      for(let i of this.metadata.info){
        if(m=='1')
          if(i.others['status']=='pending')
            arr.push(i)
        if(m=='2')
          if(i.others['status']=='accepted')
             arr.push(i)
        if(m=='3')
          if(i.others['status']=='rejected')
            arr.push(i)
    }
    if(arr.length==0){
      appendmsg('no such entries :(',2)
    }
    this.metasearch.res=arr
  }
  change_search_mode(m){
    for(let i of Object.keys(this.metasearch.typeclass)){
      this.metasearch.class[i]='xx'
    }
    this.metasearch.class[m]='selected_st_view'
    this.metasearch.mode=m
  }
  search_meta_reset(){
    this.change_search_type(this.metasearch.typemode)
  }
  serach_meta(val){
    if(val=='')return
    let arr=[]
    for(let i of this.metasearch.res){
      if(this.metasearch.mode=='1'){
        if(i.app_id.toLowerCase().includes(val.toLowerCase()))
          arr.push(i)}
      else
        if(i.name.toLowerCase().includes(val.toLowerCase()))
          arr.push(i)
    }
    if(arr.length==0){
      appendmsg("No netries Found",2)
      return
    }
    this.metasearch.res=arr
  }
  view_app(item){
    this.view.data=item
    this.view.status=true
  }
  cancel_app_view(){
    this.view.data={}
    this.view.status=false
  }
  async accept_aplication(id){
    let res=await fetch('http://localhost:2400/applications_accept',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,app:id})})
    let result=await res.json()
    console.log(result)
    if(result.status=='dp'){
      appendmsg('Student with this ID already exist',2)
      return
    }
    if(result.status=='resolved'){
      appendmsg('This application is resolved',2)
      return
    }
    if(result.status=='room'){
      appendmsg('There are not enough rooms :(',2)
      return
    }
    if(result.status!='done'){
      appendmsg('Cant do the task now :(',2)
      return
    }
    for(let i of this.metadata.info){
      if(i['app_id']==id)
        i['others']['status']='accepted'
    }
    this.change_search_type('1')
    appendmsg('Done',1)
    this.view.data={}
    this.view.status=false
  }
  async reject_aplication(id){
    let res=await fetch('http://localhost:2400/applications_reject',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,app:id})})
    let result=await res.json()
    console.log(result)
    if(result.status=='resolved'){
      appendmsg('This application is resolved',2)
      return
    }
    if(result.status!='done'){
      appendmsg('Cant do the task now :(',2)
      return
    }
    this.change_search_type('1')
    appendmsg('Done',1)
    this.view.data={}
    this.view.status=false
  }
  view_pr_pic(src,m,ev){
    this.view_pic.src=src
    let master=ev.currentTarget.getBoundingClientRect()
    console.log(master.bottom,master.right)
    this.view_pic.status=true
    this.change.detectChanges()
    this.view_pic.style=`top:${master.top-40}px; left:${master.right}px;`
  }
  cancel_pic_view(){
    this.view_pic.src=''
    this.view_pic.style=''
    this.view_pic.status=false
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