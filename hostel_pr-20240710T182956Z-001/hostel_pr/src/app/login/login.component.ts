import { Component } from '@angular/core';
import {Router} from '@angular/router'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
    mode_class={st:'active',emp:'inactive'}
    mode='st'

    constructor(private router:Router){}


    changemode(m:any){
      this.mode=m
      for(var i of Object.keys(this.mode_class)){
        this.mode_class[i]='inactive'
      }
      this.mode_class[m]="active"
      if(this.mode=='emp'){
        (document.getElementById('first_crd')as any).placeholder='Enter EmployeeId or PH.No'
      }
      else{
        (document.getElementById('first_crd')as any).placeholder='Enter your USN'
      }
    }
    async submit(id,pass,msg){
      if(id.value=='' || pass.value=='')return
      let res=await fetch('http://localhost:2400/loginrequest',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:id.value,pass:pass.value,mode:this.mode})})
      let result=await res.json()
      // result='dhj'
      if(result.status=='nouser'){
        msg.innerHTML='There is no such user'
        return
      }
      if(result.status=='dberr'){
        msg.innerHTML='Some error occured please try again after some time'
        return
      }
      if(result.status=='crd'){
        msg.innerHTML='Username/password missmatch'
        return
      }
      if(this.mode=='st'){
        this.router.navigate(['login/student',id.value],{state:{data:result.unq,pr:result.pr}})
        return
      }
      if(this.mode=='emp'&&result.warden){
        this.router.navigate(['login/warden',id.value],{state:{data:result.unq,pr:result.pr}})
        return
      }
      this.router.navigate(['login/employee',id.value],{state:{data:result.unq,pr:result.pr}})
    }
    application_new(){
      this.router.navigate(['studen_application','apply'])
    }
    application_check(){
      this.router.navigate(['studen_application','check'])
    }

}
