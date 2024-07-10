import { Component } from '@angular/core';

@Component({
  selector: 'app-qrlogin',
  templateUrl: './qrlogin.component.html',
  styleUrls: ['./qrlogin.component.css']
})
export class QrloginComponent {
  loggingto=''
  mode={mode:'1',class:{1:'selected',2:'x'}}
   ngOnInit(){
    
  }
  cancel(){
    window.close()
  }
  changemode(m){
    if(m=='1'){
      this.mode.class['1']='selected'
      this.mode.class['2']='x'
      this.mode.mode=m
      return
    }
    this.mode.class['2']='selected'
      this.mode.class['1']='x'
      this.mode.mode=m
  }
  async loggin(id,pass,msg){
    let res=await fetch('http://localhost:2400/qr_login_req',{method:'POST',headers:{'Content-Type':'application/json'}
  ,body:JSON.stringify({id:id,pass:pass,msg:msg,mode:this.mode.mode})})
  let result=await res.json()
  if(result.status=='unable'){
    appendmsg('Something went wrong :(',2)
    return
  }
  if(result.status=='cr'){
    appendmsg('Invalid credentials :(',2)
    return
  }
  appendmsg('done',1)
  window.close()
  
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
