import { Component,Input,ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-wardenhome',
  templateUrl: './wardenhome.component.html',
  styleUrls: ['./wardenhome.component.css']
})

export class WardenhomeComponent {
@Input() obj
filters_class={1:'warden_filters_selected',2:"xx",3:'xx'}
currentlogs={fetched:false,logs:[]}
logssearch={mode:1,result:[],today:true}
strength={fetched:false,total:0,str:0}
applications={fetched:false,total:0,counts:[]}
inside_view={fetched:false,st:0,emp:0}
constructor(private change:ChangeDetectorRef){}
ngOnInit(){
  this.loadresources()
}


async loadresources(){
  let res=await fetch('http://localhost:2400/warden/meta',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
  let result=await res.json()
  if(result.status=='unable'){
    return
  }
  this.currentlogs.fetched=true
  this.currentlogs.logs=result.data
  this.logssearch.result=result.data
  //
  res=await fetch('http://localhost:2400/warden/strength',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
  result=await res.json()
  if(result.status=='unable'){
    return
  }
  this.strength.fetched=true
  this.strength.str=result.data.str
  this.strength.total=result.data.total
  this.change.detectChanges()
  setstrengthbar(this.strength.str,this.strength.total)
  //
  res=await fetch('http://localhost:2400/warden/applications',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
  result=await res.json()
  if(result.status=='unable'){
    return
  }
  this.applications.fetched=true
  this.applications.counts=result.data
  this.applications.total=result.total
  //
  res=await fetch('http://localhost:2400/warden/inside_view',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
  result=await res.json()
  if(result.status=='unable'){
    return
  }
  this.inside_view.fetched=true
  this.inside_view.emp=result.data.emp
  this.inside_view.st=result.data.st
}


setlogsearchmode(m,inp:HTMLInputElement,ev){
  let btn=ev.currentTarget
  Object.keys(this.filters_class).forEach((val)=>{
    this.filters_class[val]='xx'
  })
  this.filters_class[`${m}`]='warden_filters_selected'
  inp.placeholder='Search here'
  if(m==3){
    inp.placeholder='Search here *format is dd-mm--yyyy'
  }
  if(m==4){
    if(this.logssearch.today) {this.logssearch.today=false;btn.innerHTML='Today'}
    else {this.logssearch.today=true;btn.innerHTML='Yesterday'}
  }
  this.logssearch.mode=m
}

searchinlogs(val:string,ev){
  if(this.logssearch.mode==3){
    if(!(/^(\d{2}-){2}\d{4}$/.test(val))){
      appendmsg('Invalid date Syntax',2)
      return
    }
  }
  let arr=[]
  for(let i of this.logssearch.result){
    let date_now=new Date()
    if(this.logssearch.mode==1){
      if(i.name.toLowerCase().includes(val.toLowerCase())){
        arr.push(i)
      }
    }
    if(this.logssearch.mode==2){
      if(i.log_id.toLowerCase().includes(val.toLowerCase())){
        arr.push(i)
      }
    }
    if(this.logssearch.mode==3){
      let date=val.split('-')
      let dateobj=new Date(i.timestamp)
      if(dateobj.getUTCDate().toString()==date[0]){
        arr.push(i)
      }
    }
    if(this.logssearch.mode==4){
      let dateobj=new Date(i.timestamp)
      if(this.logssearch.today){
        if(date_now.getDate()==dateobj.getDate()){
          arr.push(i)
        }
      }
      else{
        // if(date_now.get)
      }
    }
  }
  if(arr.length==0){
    appendmsg('No entries found',2)
    return
  }
  this.logssearch.result=arr
}

resetlogsearch(){
  this.logssearch.result=this.currentlogs.logs
}


async schedule_remiander(title,time,ev){
  let ele=ev.currentTarget
  ele.disabled=true
  if(!(/^(\d{2}-){2}\d{4}$/.test(time))){
    appendmsg('Invalid date Syntax',2)
    ele.disabled=false
    return
  }
  let temp=time.split('-')
  let date=new Date()
  if(date.getUTCFullYear()!=temp[2]){
    appendmsg(`cant set remainder to year ${temp[2]}`,2)
    ele.disabled=false
    return
  }
  if(temp[0]<=date.getDate()&&temp[1]<=date.getMonth()+1){
    appendmsg(`seriously!! check the date`,2)
    ele.disabled=false
    return
  }
  if(title==''){
    appendmsg('please add a title',2)
    ele.disabled=false
    return
  }
  let res=await fetch('http://localhost:2400/schedule_task',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,data:{title:title,time:time}})})
  let result=await res.json()
  console.log(result)
  ele.disabled=false
  if(result.status=='unable'){
    appendmsg('Unable to set remainder',2)
    return
  }
  appendmsg('Remainder set successfully',1)
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

function setstrengthbar(str,total){
  let per=Math.round((str/total)*100)
  let outer=document.getElementById('warden_stregth_inner') as any;
  outer.style=`background-color: greenyellow;width:${per}%`
  outer.getElementsByTagName('p')[0].innerHTML=`${per}%`
}
