import { Component, EventEmitter, Input, Output,HostListener } from '@angular/core';
import {Router,ActivatedRoute} from '@angular/router'
@Component({
  selector: 'app-sendmail',
  templateUrl: './sendmail.component.html',
  styleUrls: ['./sendmail.component.css'],
})
export class SendmailComponent {
constructor(private router:Router,private route:ActivatedRoute){}
mail={mail:'',unq:''}
ngOnInit(){
  this.mail.mail=this.route.snapshot.params['mail']
  this.mail.unq=this.route.snapshot.params['unq']
}
@HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: Event): void {
    // Navigate to the base route before the page is reloaded
    this.router.navigate(['/management']);
  }
async sendmail(mail,msg,resmsg){
    if(msg.value=='')return
    let res=await fetch('http://localhost:2400/sendmail/management',{method:'POST',headers:{'Content-Type':'application/json'}
    ,body:JSON.stringify({mail:mail.innerHTML,msg:msg.value,unq:mail.className})})
    let result=await res.text()
    console.log(result)
    this.done()
}
done(){
  this.router.navigate(['management'])
}
}
