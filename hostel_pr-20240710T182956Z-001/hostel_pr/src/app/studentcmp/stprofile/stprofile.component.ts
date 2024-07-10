import { Component,Input,ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-stprofile',
  templateUrl: './stprofile.component.html',
  styleUrls: ['./stprofile.component.css']
})
export class StprofileComponent {
  @Input() obj
  profile={fetched:false,pic:'',name:'',mobile:'',email:'',adhar:'',current_state:'',logs:[],adress:{},ID:'',rm:'',fees:[]}
  change_details={status:false,profile_pic:{name:'',pic:''}}
  chnagepass={status:false,otp:false,resend:120,change:false}
  logsserach={fetched:false,mode:'1',class:{1:'logs_search_selected',2:'xxx',3:"xxx"},cur_logs:[]}
  st_searchs={logs:[],log_mode:'1',fees:[],log_class:{1:'selected_st_view',2:'x'}}
  constructor(private change:ChangeDetectorRef){}
  ngOnInit(){
    this.loadresources()
  }
  async loadresources(){
    let res=await fetch('http://localhost:2400/profile_req',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,mode:'st'})})
    let result=await res.json()
    console.log(result)
    if(result.status=='unable')return
    this.profile.fetched=true
    this.profile.ID=result.data.USN
    this.profile.rm=result.data.Room_no
    this.profile.name=result.data.Name
    this.profile.mobile=result.data.Mobile
    this.profile.email=result.data.E_mail
    this.profile.adhar=result.data.Aadhar_number
    this.profile.current_state=result.data.Status
    this.profile.pic=result.data.Profile_pic
    this.profile.fees=result.data.others.fees
    this.st_searchs.fees=this.profile.fees
    this.profile.adress=`${result.data.Address.cl},${result.data.Address.country},${result.data.Address.state},${result.data.Address.dist},${result.data.Address.pin}`
    if(result.data.others.hasOwnProperty('logs')){
      this.profile.logs=result.data.others.logs
      for(let i in this.profile.logs){
        let date=new Date(this.profile.logs[i].date)
        let newt={time:`${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`,date:{day:date.getDate(),month:date.getMonth()+1,year:date.getFullYear()}}
        this.profile.logs[i].time=newt
      }
      this.logsserach.cur_logs=this.profile.logs
    }
  }
  change_detailscancel(){
    this.change_details.profile_pic.pic=''
    this.change_details.profile_pic.name=''
    this.change_details.status=false
  }
  change_details_inp(ev){
    let ele=ev.currentTarget
    this.change_details.profile_pic.pic=ele.files[0]
    this.change_details.profile_pic.name=ele.files[0].name
  }
  async change_detail_send(){
    let inp=document.getElementById('w_pr_change_details_inner').getElementsByTagName('input')
    for(let i=0;i<inp.length;i++){
      if(inp[i].type=='text'&&inp[i].value==''){
        appendmsg('missing field',2)
        inp[i].focus()
        return
      }
    }
    let form=new FormData()
    form.append('meta',getinps('w_pr_change_details_inner'))
    form.append('profile_pic',this.change_details.profile_pic.pic)
    form.append('id',this.obj.id)
    form.append('unq',this.obj.unq)
    form.append('mode','st')
    form.append('usn',this.profile.ID)
    let res=await fetch('http://localhost:2400/profile_change',{method:'POST',
    body:form})
    let result=await res.json()
    if(result.status=='unable'){
      appendmsg('Unable to update :(',2)
      return
    }
    if(result.hasOwnProperty('path'))
      this.profile.pic=result.path
    appendmsg('Updated successfully',1)
    await this.loadresources()
    this.change_detailscancel()
  }
  async sendotp(ev,relf){
    let ele=ev.currentTarget
    ele.disabled=true
    let res=await fetch('http://localhost:2400/req_otp',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,mode:'st'})})
    let result=await res.json()
    console.log(result)
    if(result.status=='unable'){
      appendmsg('Unable to send OTP :(',2)
      ele.disabled=false
      return
    }
    relf.innerHTML=result.mail
    this.chnagepass.otp=true
    this.change.detectChanges()
    this.chnagepass.resend=120
    let time=setInterval(()=>{
      if(this.chnagepass.resend==0){
        ele.disabled=false
        clearInterval(time)
      }
      this.chnagepass.resend--
    },1000)

  }
  async submitotp(mail){
    let inp=document.getElementById('w_pr_change_pass_inner').getElementsByClassName('enterotp')[0].getElementsByTagName('input')
    let otp=''
    for(let i=0;i<inp.length;i++){
      otp+=inp[i].value
    }
    if(otp=='')return
    let res=await fetch('http://localhost:2400/validate_otp',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,mail:mail.innerHTML,otp:otp})})
    let result=await res.json()
    if(result.status=='unable'){
      appendmsg('Some Error ocuured',2)
      return
    }
    if(result.status=='nootp'){
      appendmsg('No otp was sent to you',2)
      return
    }
    if(result.status=='ex'){
      appendmsg('otp has expired',2)
      return
    }
    if(result.status=='na'){
      appendmsg('you have entered wrong otp',2)
      return
    }
    appendmsg('OTP varified',1)
    this.chnagepass.change=true
  }

  cancel_pass_change(){
    this.chnagepass.otp=false
    this.chnagepass.status=false
    this.chnagepass.change=false
  }
  async changepass_final(pass1,pass2,ev,mail){
    let ele=ev.currentTarget
    ele.disabled=true
    if(pass1.length<6){
      appendmsg('password must have atleast 6 letters',2)
      return
    }
    if(pass1!=pass2){
      appendmsg('Password mismatch',2)
      return
    }
    let res=await fetch('http://localhost:2400/chnage_pass_req',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,mail:mail.innerHTML,pass:pass1,mode:'st'})})
    let result=await res.json()
    if(result.status=='unable'){
      appendmsg('unable to change password',2)
      return
    }
    if(result.status=='ex'){
      appendmsg('otp varification was expired',2)
      return
    }
    appendmsg('password changed successfully',1)
    this.cancel_pass_change()
  }
  async markleave(rs){
    if(rs==''){
      appendmsg('You should have a reason',2)
      return
    }
    let res=await fetch('http://localhost:2400/emp_change_state',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,rs:rs})})
    let result=await res.json()
    if(result.status!='done'){
      appendmsg('unable to update :(',2)
      return
    }
    appendmsg('status updated,come back soon :)',1)
    this.profile.current_state='onleave'
    //socket
  }
  async markleav_gotback(){
    let res=await fetch('http://localhost:2400/emp_change_state_gotback',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
    let result=await res.json()
    if(result.status!='done'){
      appendmsg('unable to update :(',2)
      return
    }
    appendmsg('status updated',1)
    this.profile.current_state='notactive'
  }
  Seach_logs(val){
    if(val=='')return
    if(this.logsserach.mode=='2'){
      if(!(/^(\d{2}-){2}\d{4}$/.test(val))){
        appendmsg('Invalid date Syntax',2)
        return
      }
    }
    let arr=[]
    for(let i of this.logsserach.cur_logs){
      if(this.logsserach.mode=='1'){
        if(i.state==val)
          arr.push(i)
      }
      if(this.logsserach.mode=='3'){
        if(i.msg.toLowerCase().includes(val.toLowerCase()))
          arr.push(i)
      }
      else{
        let temp=val.split('-')
        if(i.time.date.day==temp[0]&&i.time.date.month==temp[1]&&i.time.date.year==temp[2])
          arr.push(i)
      }
    }
    if(arr.length==0){
      appendmsg('no entries found',2)
      return
    }
    this.logsserach.cur_logs=arr
  }
  changelogsearchmode(m,inp:HTMLInputElement){
    for(let i of Object.keys(this.logsserach.class)){
      this.logsserach.class[i]='xxx'
    }
    if(m=='2'){
      inp.placeholder='Search here...*dd-mm-yyyy'
    }
    else{
      inp.placeholder='Search here...'
    }
    this.logsserach.class[m]="logs_search_selected"
    this.logsserach.mode=m
  }
  reset_logs_search(){
    this.logsserach.cur_logs=this.profile.logs
  }
  reset_in_st_fees(){
    this.st_searchs.fees=this.profile.fees
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
}
function getinps(id){
  let obj={}
  obj['name']=(document.getElementById('w_pr_change_details_name')as any).value;
  obj['mobile']=(document.getElementById('w_pr_change_details_mobile')as any).value;
  obj['email']=(document.getElementById('w_pr_change_details_email')as any).value;
  obj['adhar']=(document.getElementById('w_pr_change_details_adhar')as any).value;
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
