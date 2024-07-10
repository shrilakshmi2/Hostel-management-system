import { ChangeDetectorRef, Component,Input } from '@angular/core';

@Component({
  selector: 'app-wardenemployees',
  templateUrl: './wardenemployees.component.html',
  styleUrls: ['./wardenemployees.component.css']
})
export class WardenemployeesComponent {
  @Input() obj
  metadata={fetched:false,info:[],total:0,in:0,out:0}
  metasearch={mode:'1',class:{1:'selected_meta_search',2:'x',3:'x'},logs:[]}
  addemp={status:false,details:{name:'',gname:'',ph:'',email:'',adhar:'',cl:"",country:'',state:'',dist:'',pin:''},profile:{name:'',pic:''}}
  st_view={status:false,data:{}}
  st_searchs={logs:[],log_mode:'1',fees:[],log_class:{1:'selected_meta_search',2:'x'}}
  rm_emp={status:false,id:'',name:''}
  mailsend={status:false,to:''}
  update_sal={status:false,id:'',name:'',des:'',sug:{status:true,res:[],ele:{name:'',id:'',des:''}}}
  constructor(private change:ChangeDetectorRef){}
  ngOnInit(){
    this.loadresoueces()
  }

  async loadresoueces(){
    let res=await fetch('http://localhost:2400/employee_details_req_count',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq})})
    let result=await res.json()
    if(result.status!='done'){
      return
    }
    this.metadata.total=result.count 
    this.metadata.in=result.in
    this.metadata.out=result.out
    console.log(result)
    for(let i of result.list){
      await this.getemployees_meta(i,0)
    }
    this.metadata.fetched=true
    this.metasearch.logs=this.metadata.info
    console.log(this.metadata)
  }
  async getemployees_meta(id,m){
    let res=await fetch('http://localhost:2400/employee_details_req_details',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,emp:id})})
    let result=await res.json()
    if(result.status!='done'){
      return
    }
    if(!result.data.hasOwnProperty('cur_sal')){
      result.data['cur_sal']={amt:'',date:'none'}
    }
    if(m==0){
      this.metadata.info.push(result.data)
      return
    }
    for(let i in this.metadata.info){
      if(result.data.Mobile_no==this.metadata.info[i].Mobile_no){
        this.metadata.info[i]=result.data
        return
      }
    }
  }

  addprofile_emp_add(ev){
    let inp=ev.currentTarget
    this.addemp.profile.name=inp.files[0].name
    this.addemp.profile.pic=inp.files[0]
  }
  async add_emp_w_final(){
    let inp=document.getElementById('add_emp_w_inner').getElementsByTagName('input')
    let arr=[]
    for(let i=0;i<inp.length;i++){
      if(inp[i].type=='text'||inp[i].type=='number')
        arr.push(inp[i])
    }
    let btn=''
    for(let i=0;i<inp.length;i++){
      if(inp[i].type=='text'||inp[i].type=='number'){
        if(inp[i].value==''){
          appendmsg('Missing field',2)
          inp[i].focus()
          return
        }
      }
      if(inp[i].type=='radio'&&inp[i].checked){
        console.log(inp[i].checked)
        btn=inp[i].value
      }
    }
    if(btn==''){
      appendmsg('select desigantion',2)
      return
    }
    let form=new FormData()
    let keys=Object.keys(this.addemp.details)
    for(let i in keys){
      this.addemp.details[keys[i]]=arr[i].value
      form.append(keys[i],arr[i].value)
    }
    form.append('des',btn)
    form.append('profile_pic',this.addemp.profile.pic)
    form.append('check_id',this.obj.id)
    form.append('check_unq',this.obj.unq)
    let res=await fetch('http://localhost:2400/managerlogin/addemployee',{method:'POST',body:form})
    let result=await res.json()
    if(result.status=='ex'){
      appendmsg('Mobile number exists',2)
      return
    }
    if(result.status=='mail'){
      appendmsg('Check the mail',2)
      return
    }
    if(result.status!='done'){
      appendmsg('Unable to add :(',2)
      return
    }
    appendmsg('employee added :)',1)
    this.getemployees_meta(this.addemp.details.ph,0)
    this.calcel_add_emp()
  }
  calcel_add_emp(){
    for(let i of Object.keys(this.addemp.details)){
      this.addemp.details[i]=''
    }
    this.addemp.profile.name=''
    this.addemp.profile.pic=''
    this.addemp.status=false
  }

  //searchs
  emp_search_mode(m){
    for(let i of Object.keys(this.metasearch.class))
      this.metasearch.class[i]='xx'
    this.metasearch.mode=m
    this.metasearch.class[m]='selected_meta_search'
  }
  emp_table_search(val){
    if(val=='')return
    let arr=[]
    for(let i of this.metasearch.logs){
      if(this.metasearch.mode=='1'){
        if(i.Name.toLowerCase().includes(val.toLowerCase())){
          arr.push(i)
        }
      }
      if(this.metasearch.mode=='2'){
        if(i.Mobile_No.toLowerCase().includes(val.toLowerCase()))
        arr.push(i)
      }
      else{
        if(i.Designation==val)
          arr.push(i)
      }
    }
    if(arr.length==0){
      appendmsg('no entries found',2)
      return
    }
    this.metasearch.logs=arr
  }
  emp_table_search_reset(){
    this.metasearch.logs=this.metadata.info
  }

  student_view(item){
    this.st_view.data=item
    this.st_view.status=true
    this.st_searchs.logs=item['logs']
    this.st_searchs.fees=item['sal']
  }
  cancel_st_view(){
    this.st_view.data={}
    this.st_view.status=false
    this.st_searchs.logs=[]
    this.st_searchs.fees=[]
  }

  change_searchmode_st_logs(m,inp:HTMLInputElement){
    if(m=='1'){
      this.st_searchs.log_class[m]='selected_meta_search'
      this.st_searchs.log_class['2']='x'
      inp.placeholder='Search here'
    }
    else{
      this.st_searchs.log_class[m]='selected_meta_search'
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
        if(i.status==val)
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
  remove_student(id,name){
    this.rm_emp.status=true
    this.rm_emp.id=id
    this.rm_emp.name=name
  }
  cnacel_rm_student(){
    this.rm_emp.status=false
    this.rm_emp.id=''
    this.rm_emp.name=''
  }
  async remove_student_final(){
    let res=await fetch('http://localhost:2400/rm_emp',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,emp:this.rm_emp.id})})
    let result=await res.json()
    if(result.status!='done'){
      appendmsg('unable to remove employee :(',2)
      return
    }
    appendmsg('Employee removed successfully',1)
    for(let i=0;i<this.metadata.info.length;i++){
      if(this.metadata.info[i].Mobile_no==this.rm_emp.id)
        this.metadata.info.splice(i,1)
    }
    this.cnacel_rm_student()
  }

  sendmail_ini(to){
    this.mailsend.to=to
    this.mailsend.status=true
  }
  sendmail_cancel(){
    this.mailsend.to=''
    this.mailsend.status=false
  }
  async sendmail_final(msg,ev){
    let ele=ev.currentTarget
    ele.disabled=true
    let res=await fetch('http://localhost:2400/sendmail/management',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq,email:this.mailsend.to,msg:msg})})
    let result=await res.json()
    ele.disabled=false
    if(result.status!='done'){
      appendmsg("unable to send Mail :(",2)
      return
    }
    appendmsg('email sent :)',1)
    this.sendmail_cancel()
  }

  Show_suggesion(ev,id,name,des){
    let inp=ev.currentTarget
    let arr=[]
    for(let i of this.metadata.info){
      if(i.Mobile_No.toLowerCase().includes(inp.value.toLowerCase())){
        arr.push(i)
      }
    }
    this.update_sal.sug.res=arr
    this.update_sal.sug.ele.name=name
    this.update_sal.sug.ele.id=id
    this.update_sal.sug.ele.des=des
    this.update_sal.sug.status=true
    this.change.detectChanges()
    align_suggesion(inp)
  }
  cancel_suggesion(){
    this.update_sal.sug.status=false
  }
  autofill(item){
    (this.update_sal.sug.ele.id as any).value=item['Mobile_No'];
    (this.update_sal.sug.ele.des as any).value=item['Designation'];
    (this.update_sal.sug.ele.name as any).value=item['Name'];
    this.update_sal.id=item['Mobile_No'];
    this.update_sal.name=item['Name'];
    this.update_sal.sug.status=false
  }
  cancel_update_sal(){
    this.update_sal={status:false,id:'',name:'',des:'',sug:{status:true,res:[],ele:{name:'',id:'',des:''}}}
  }
  async update_sal_final(pid){
    console.log(this.update_sal.id)
    let res=await fetch('http://localhost:2400/update_sal_status',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:this.obj.id,unq:this.obj.unq, emp:this.update_sal.id, pid:pid})})
    let result=await res.json()
    if(result.status!='done'){
      appendmsg('unable to Update :(',2)
      return
    }
    appendmsg('Updated',1)
    this.getemployees_meta(this.update_sal.id,1)
    this.cancel_update_sal()
    
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

function align_suggesion(inp){
  let master=inp.getBoundingClientRect()
  let that=document.getElementById("update_sal_suggesion") as any;
  that.style=`top:${master.bottom}px;left:${master.left+10}px`
}