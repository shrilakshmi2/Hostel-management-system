const ex=require('express')
const cron=require('node-cron')
const fs=require('fs')
const date=new Date()
const app=ex()
const http=require('http')
const sever=http.createServer(app)
const qr=require('qrcode')
const cors=require('cors')
const {Server}=require('socket.io')
const io=new Server(sever,{cors:{origin: '*',
methods: ['GET', 'POST'],}})
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
  };

let logintimeoutobj={}
let scheduler={}
let scheduler_counter=0

let reloadobj={}
init()
const body_parser=require('body-parser')
const sql=require("mysql2/promise")
const pool=sql.createPool({
  host:'localhost',
  port:'3306',
  user:'root',
  password:'danju@123',
  database:'hostel_management',
})

let multer=require('multer')
const disk=multer.diskStorage({
  destination:(req,file,cb)=>{
    return cb(null,'./images')
  },
  filename:(req,file,cb)=>{
    return cb(null,file.originalname)
  }
})
const corsh=(req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}
const imgupload=multer({storage:disk})
const mailer=require('nodemailer')
const util=require('util')
let transport=mailer.createTransport({
  service:'gmail',
  auth:{
    user:'danjuhegde50@gmail.com',
    pass:'qqka bjmv yhtu ymxb'
  }
})
let mailpromise=util.promisify(transport.sendMail).bind(transport);
app.use(cors(corsOptions))
app.use(ex.urlencoded({extended:true}))
app.use(body_parser.json())
app.use(body_parser.urlencoded({extended:true}))



app.post("/loginrequest",async (req,res)=>{
    let result
    if(req.body.mode=='emp')
      result=await querydatabase('select e_credentials,name,designation,profile_pic from employee where mobile_no=?',[req.body['id']])
    else
      result=await querydatabase('select s_credentials,name,profile_pic from student where usn=?',[req.body['id']])
    console.log(result)
    if(result.status=='err'){
      res.json({status:"dberr"})
      return
    }
    if(result.result.length==0){
      res.json({status:"nouser"})
      return
    }
    let cred='s_credentials',warden=false
    if(req.body.mode=='emp'){
      cred='e_credentials'
      if(result.result[0].designation=='Warden')
        warden=true
    }
    if(result.result[0][cred]['pass']!=req.body.pass){
      res.json({status:"crd"})
      return
    }
    let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
    let unq=Date.now()
    Object.assign(master,{[req.body['id']]:unq})
    fs.writeFileSync('./login.txt',JSON.stringify(master))
    logentry(req.body.id,result.result[0]['name'])
    generatetoken()
    let timeout=logintimeout(req.body.id,result.result[0].name)
    if(!fs.existsSync(`././hostel_management/src/assets/${req.body.id}`))
        fs.mkdirSync(`././hostel_management/src/assets/${req.body.id}`)
    fs.writeFileSync(`././hostel_management/src/assets/${req.body.id}/${result.result[0].profile_pic.name}`,Buffer.from(result.result[0].profile_pic.pic,'base64'))
    res.json({status:'ok',unq:unq,warden:warden,pr:`/assets/${req.body.id}/${result.result[0].profile_pic.name}`})
})

app.post('/logout',(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  clearTimeout(logintimeoutobj[req.body.id])
  delete logintimeoutobj[req.body.id]
  delete master[req.body.id]
  fs.writeFileSync("./login.txt",JSON.stringify(master))
  deleteallfiles(req.body.id)
  master=JSON.parse(fs.readFileSync('./online.txt','utf-8'))
  master.online.splice(master.online.indexOf(req.body.id),1)
  fs.writeFileSync('./online.txt',JSON.stringify(master))
  res.send('done')
})



app.post('/loginvalide',(req,res)=>{
  console.log(req.body)
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  for(let i of Object.keys(master)){
    if(i==req.body.id&&master[i]==req.body.unq){
      res.send('loggedin')
      return
    }
  }
  res.send('notloggedin')
})

app.post('/managerlogin',(req,res)=>{
  if(req.body.id!='admin'){
    res.send('err')
    return
  }
  if(req.body.pass!='12345678'){
    res.send('err')
    return
  }
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(master.hasOwnProperty('management')){
    res.send('loggedin')
    return
  }
  let unq=Date.now()
  Object.assign(master,{'management':unq})
  fs.writeFileSync('./login.txt',JSON.stringify(master))
  logintimeout('management')
  res.send(`${unq}`)
})

app.post('/managerlogin/addemployee',imgupload.single('profile_pic'),async (req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.check_id,req.body.check_unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let profile={pic:'',name:''}
  if(!req.file){
    profile.pic=fs.readFileSync('././hostel_management/src/assets/defaultprofile.png').toString('base64')
    profile.name='defaultprofile.png'
  }
  else{
    profile.pic=fs.readFileSync(`./images/${req.file.filename}`).toString('base64')
    profile.name=`${Date.now()}_${req.file.filename}`
    fs.unlinkSync(`./images/${req.file.filename}`)
  }
  let password=`emp_${Date.now()}`
  let date=new Date()
  let result=await querydatabase('insert into employee values(?,?,?,?,?,?,?,?,?,?,?)',[
    JSON.stringify({id:req.body.ph,pass:password}),
    req.body.ph,
    req.body.gname,
    req.body.email,
    JSON.stringify({cl:req.body.cl,country:req.body.country,state:req.body.state,dist:req.body.dist,pin:req.body.pin}),
    'active',
    req.body.name,
    req.body.adhar,
    req.body.des,
    JSON.stringify({logs:[],sal:[],joined_on:date.toISOString()}),
    JSON.stringify(profile)
  ])
  if(result.status=='err'){
    if(result.code==1062){
      res.json({status:'ex'})
      return
    }
    else{
      res.json({status:'unable'})
      return
    }
  }
  let msg=`Hayy...Thanks for Joining our Hostel
          designation:${req.body.des}
          password:${password}`
  let mailres=await sendmail(req.body.email,msg)
  if(mailres=='err'){
    res.json({status:'mail'})
    await querydatabase('delete from employee where mobile_no=?',[info.phone])
    return
  }
  date.setMonth(date.getMonth()+3)
  result=await querydatabase('insert into salary values(?,?,?,?,?)',[req.body.ph,date.toISOString(),date.toISOString(),'60000',JSON.stringify({})])
  res.json({status:'done'})
})

app.post('/managerlogout',(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if (master.hasOwnProperty('management')&&master['management']==req.body.id){
   delete master['management']
  clearTimeout(logintimeoutobj['management'])
  fs.writeFileSync('./login.txt',JSON.stringify(master))
  res.send('done')
  deleteallfiles('management')
  return
  }
  res.send('no')
})

app.post("/reload_done",(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let t=setTimeout(() => {
    let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
    delete master[req.body.id]
    fs.writeFileSync('./login.txt',JSON.stringify(master))
    delete reloadobj[req.body.id]
    clearInterval(logintimeoutobj[req.body.id])
  }, 60000);
  reloadobj[req.body.id]=t
})


app.post('/reload_valid',(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:false})
    return
  }
  if(!reloadobj.hasOwnProperty(req.body.id)){
    res.json({status:false})
    return
  }
  clearInterval(reloadobj[req.body.id])
  res.json({status:true,data:master[req.body.id]})

})

app.post('/emp_detail_req',async (req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(master.hasOwnProperty('management')){
    if(master['management']==req.body.id){
      let result=await querydatabase('select * from employee where mobile_no=?',[req.body.emp])
      if(result.status=='err'){
        res.json({status:'err'})
        return
      }
      let obj=result.result[0]
      delete obj['E_credentials']
      fs.writeFileSync(`./hostel_management/src/assets/management/${obj['Profile_pic']['name']}`,Buffer.from(obj['Profile_pic']['pic'],'base64'))
      obj['Profile_pic']['pic']=`/assets/management/${obj['Profile_pic']['name']}`
      res.json({status:'ok',list:obj})
      return
    }
  }
  res.json({status:'err'})
})

app.post('/emp_list_req',async (req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(master.hasOwnProperty('management')){
    if(master['management']==req.body.id){
      let result=await querydatabase('select mobile_no from employee',[])
      let mb=[]
      for(let i of result.result){
        mb.push(i.mobile_no)
      }
      res.json({status:'ok',list:mb})
      return
    }
  }
  res.json({status:'err'})
})

app.post('/sendmail/management',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
  }
  let html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          h3{
              color: green;
          }
      </style>
  </head>
  <body>
      <h3>This email is from the Hostels management</h3>
      <pre>${req.body.msg}</pre>
  </body>
  </html>`
  let result=await sendmail(req.body.email,html)
  if(result=='err'){
    res.json({status:'unable'})
    return
  }
  res.json({status:'done'})
})

app.post('/getqrcode',(req,res)=>{
  let msg='baaal'
  qr.toFile('./hostel_management/src/assets/qr.png',msg,(err)=>{
    if(err){
      res.send('err')
      return
    }
    res.send('/assets/qr.png')
  })
})


app.post('/loginvalidationtimer',(req,res)=>{
  // let master=fs.readFileSync('')
  let timeout=logintimeout(req.body.id)
})
app.post('/rm_emp',async (req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select e_mail from employee where mobile_no=?',[req.body.emp])
  let mail=result.result[0].e_mail
   result=await querydatabase("delete from employee where mobile_no=?",[req.body.emp])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let html=`<!DOCTYPE html>
  <html lang="en">
  <head>
  </head>
  <body>
      <h4>Thank you for your service</h4>
      <pre>We are sorry to inform you that 
          you are no longer the part of our Hostel.
          Good luck with the future!!
      </pre>
  </body>
  </html>`
  sendmail(mail,html)
  res.json({status:'done'})
})

app.post('/management/others',async (req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty('management')){
    res.json({status:'unable'})
    return
  }
  if(master['management']!=req.body.id){
    res.json({status:'unable'})
    return
  }
  let result= await querydatabase('select room_number,room_status from room',[])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let ca=0
  for(let i of result.result){
    if(i.room_status=='available')
      ca++
  }
  res.json({status:'ok',res:{ct:result.result.length,ca:ca}})
})

app.post('/addrooms',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty('management')){
    res.json({status:'unable'})
    return
  }
  if(master['management']!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select max(room_number) as max from room',[])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let max=result.result[0].max
  let query='insert into room values(?,?,?)'
  let arr=['available',++max,JSON.stringify({})]
  for(let i=1;i<req.body.rooms;i++){
    query+=',(?,?,?)'
    for(let i=0;i<=2;i++){
      arr.push('available',++max,JSON.stringify({}))
    }
  }
  result=await querydatabase(query,arr)
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  res.json({status:'done'})
})
app.post('/block_rooms',async (req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty('management')){
    res.json({status:'unable'})
    return
  }
  if(master['management']!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select max(room_number) as max from room',[])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  for(let i of req.body.list){
    if(i>result.result[0].max){
      res.json({status:'noroom',no:i})
      return
    }
  }
  result=await querydatabase('update room set room_status=? where room_number in (?)',['notavailabe',req.body.list])
  if(result.status=='err')
  {
    res.json({status:'unable'})
    return
  }
  res.json({status:'done'})
})

app.post('/application_submit',imgupload.fields([
  {name:'adhar', maxCount:1},{name:'profile_pic',maxCount:1}
]),async (req,res)=>{
  let result=await querydatabase('select collage from applications')
  for(let i of result.result){
    if(i.collage['usn']==req.body.college.usn){
      res.send('dp')
      return
    }
  }
  let meta=JSON.parse(req.body.meta)
  let adhartext=await checkinsideimage(`./images/${req.files.adhar[0].filename}`)
  let adharvalidate=103
  if(adhartext.status=='err')adharvalidate=100
  else if(/\d{4}\s?\d{4}\s?\d{4}/.test(adhartext)){ 
    let macth=adhartext.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/g)
    console.log(macth)
     macth=macth[0].splice(macth.indexOf(' '),2)
    if(macth==meta.adhar){
      adharvalidate=102
    }
  }
  let id=JSON.parse(fs.readFileSync('./app_ids.txt','utf-8'))
  let app_id=id['id']++
  let date=new Date()
  fs.writeFileSync('./app_ids.txt',JSON.stringify(id))
   result=await querydatabase('insert into applications values(?,?,?,?,?,?,?,?,?,?,current_timestamp)',[
    meta.name,
    meta.email,
    meta.gname,
    JSON.stringify({no:meta.adhar,pic:fs.readFileSync(`./images/${req.files.adhar[0].filename}`).toString('base64')}),
    req.body.college,
    JSON.stringify({pic:fs.readFileSync(`./images/${req.files.profile_pic[0].filename}`).toString('base64'),name:req.files.profile_pic[0].filename}),
    req.body.address,
    JSON.stringify({adhardetection:adharvalidate,status:1000}),
    `application_${app_id}`,
    meta.ph,
  ])
  fs.unlinkSync(`./images/${req.files.adhar[0].filename}`)
  fs.unlinkSync(`./images/${req.files.profile_pic[0].filename}`)
  if(result.status=='err'){
    res.json({status:'err'})
    return
  }
  let mailres=await sendmail(meta.email,`Your application is submitted successfully
  you will recieve an email after confirmation
  your application ID:> application_${app_id}`)
  if(mailres=='err'){
    let result=await querydatabase('delete from applications where app_id=?',[`application_${app_id}`])
    res.json({status:'mailerr'})
    return
  }
  res.json({status:'done'})
})

app.post('/check_appilication_status',async (req,res)=>{
  let result=await querydatabase('select * from applications where app_id=?',[req.body.id])
  if(result.status=='err'){
    res.json({status:'dberr'})
    return
  }
  if(result.result.length==0){
    res.json({status:'none'})
    return
  }
  let obj={app_id:result.result[0].app_id,
    name:result.result[0].name,
    email:result.result[0].email,
    mobile:result.result[0].mobile
  }
  if(result.result[0].others.status==1000){
    res.json({status:'rv',data:obj})
    return
  }
  else if(result.result[0].others.status==1001){
    res.json({status:'404',data:obj})
    return
  }
  else{
    res.json({status:'done',data:obj})
  }
})

app.post('/warden/meta',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase(`SELECT * FROM logs
  WHERE MONTH(timestamp) = MONTH(CURDATE()) AND YEAR(timestamp) = YEAR(CURDATE());
  `,[])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  res.json({status:'done',data:result.result})
})

app.post('/warden/strength',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase(`SELECT
  (SELECT COUNT(usn) FROM student) AS usn_count,
  (SELECT COUNT(room_number) FROM room) AS room_count;
`,[])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let total=result.result[0].room_count*3
  res.json({status:'ok',data:{str:result.result[0].usn_count,total:total}})
})

app.post('/st_emp_status',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select name,mobile_no,status from employee',[])
  res.json({status:'done',data:result.result})
})

app.post('/warden/applications',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select month(datetime) as month,year(datetime) as year,count(app_id) as count from applications group by month(datetime),year(datetime) order by month(datetime)',[])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let arr=[]
  let date=new Date()
  for(let i of result.result){
    if(i.year==date.getFullYear()){
      arr.push(i)
    }
  }
  result=await querydatabase('select count(app_id) as totalcount from applications')
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  res.json({status:'done',data:arr,total:result.result[0].totalcount})
})

app.post('/warden/inside_view',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select count(status) as count from student where status=?',['active'])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let obj={st:result.result[0].count,emp:0}
   result=await querydatabase('select count(status) as count from employee where status=?',['active'])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  obj.emp=result.result[0].count
  res.json({status:'ok',data:obj})
})

app.post('/schedule_task',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select e_mail from employee where mobile_no=?',[req.body.id])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let obj={title:req.body.data.title,email:result.result[0].e_mail,time:req.body.data.time}
  setschedule(obj)
  res.json({status:'done'})
})

app.post("/profile_req",async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let query=''
  if(req.body.mode=='emp')
    query='select * from employee where mobile_no=?'
  else
    query='select * from student where usn=?'
  let result=await querydatabase(query,[req.body.id])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let obj=adaptfor_front(result.result[0],req.body.mode)
  obj['Profile_pic']=`/assets/${req.body.id}/${obj['Profile_pic'].name}`
  res.json({status:'done',data:obj})
})

app.post('/profile_change',imgupload.single('profile_pic'),async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let profile={pic:'',name:''}
  let meta=JSON.parse(req.body.meta)
  if(req.file){
    profile.pic=fs.readFileSync(`./images/${req.file.filename}`).toString('base64')
    profile.name=`${Date.now()}-${req.file.filename}`
    fs.unlinkSync(`./images/${req.file.filename}`)
  }
  if(req.body.mode=='emp'){
    if(req.file){
      let result=await querydatabase('update employee set name=?,mobile_no=?,e_mail=?,aadhar=?,profile_pic=? where mobile_no=?',
      [meta.name,meta.mobile,meta.email,meta.adhar,JSON.stringify(profile),req.body.id2])
      if(result.status=='err'){
        res.json({status:'unable'})
        return
      }
      let newpath=writeupdatedfile(profile,req.body.id2)
      res.json({status:'done',path:newpath})
    }
    else{
      let result=await querydatabase('update employee set name=?,mobile_no=?,e_mail=?,aadhar=? where mobile_no=?',
      [meta.name,meta.mobile,meta.email,meta.adhar,meta.mobile])
      if(result.status=='err'){
        res.json({status:'unable'})
        return
      }
      res.json({status:'done'})
    }
  }
  else{
    if(req.file){
      let result=await querydatabase('update student set name=?,mobile=?,e_mail=?,aadhar_number=?,profile_pic=? where usn=?',
      [meta.name,meta.mobile,meta.email,meta.adhar,JSON.stringify(profile),req.body.usn])
      if(result.status=='err'){
        res.json({status:'unable'})
        return
      }
      let newpath=writeupdatedfile(profile,req.body.usn)
      res.json({status:'done',path:newpath})
    }
    else{
      let result=await querydatabase('update student set name=?,mobile=?,e_mail=?,aadhar_number=? where usn=?',
      [meta.name,meta.mobile,meta.email,meta.adhar,req.body.usn])
      if(result.status=='err'){
        res.json({status:'unable'})
        return
      }
      res.json({status:'done'})
    }
  }
})

app.post('/req_otp',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let query=''
  if(req.body.mode=='emp'){
    query='select e_mail from employee where mobile_no=?'
  }
  else{
    query='select e_mail from student where usn=?'
  }
  let result=await querydatabase(query,[req.body.id])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let otp=generateotp()
  let html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <p>A password rest req was made....</p>
      <p>here is your Otp</p>
      <h3>${otp}</h3>
  </body>
  </html>`
  let mailres=await sendmail(result.result[0].e_mail,html)
  if(mailres=='err'){
    res.json({status:'unable'})
    return
  }
  master=JSON.parse(fs.readFileSync('./otps.txt','utf-8'))
  master[result.result[0].e_mail]=otp
  let em=result.result[0].e_mail
  fs.writeFileSync('./otps.txt',JSON.stringify(master))
  setInterval(() => {
    let master2=JSON.parse(fs.readFileSync('./otps.txt','utf-8'))
    master2[em]='expired'
    fs.writeFileSync('./otps.txt',JSON.stringify(master2))
  }, 300000);
  res.json({status:'done',mail:result.result[0].e_mail})
})

app.post('/validate_otp',(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  master=JSON.parse(fs.readFileSync('./otps.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.mail)){
    res.json({status:'nootp'})
    return
  }
  if(master[req.body.mail]=='expired'){
    res.json({status:'ex'})
    return
  }
  if(master[req.body.mail]!=req.body.otp){
    res.json({status:'na'})
    return
  }
  master[req.body.mail]='varified'
  fs.writeFileSync('./otps.txt',JSON.stringify(master))
  res.json({status:'done'})
})

app.post('/chnage_pass_req',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  master=JSON.parse(fs.readFileSync('./otps.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.mail)){
    res.json({status:'ex'})
    return
  }
  if(master[req.body.mail]!='varified'){
    res.json({status:'ex'})
    return
  }
  if(req.body.mode=='emp'){
    let result=await querydatabase('update employee set e_credentials=? where mobile_no=?',[
      JSON.stringify({id:req.body.id,pass:req.body.pass}),
      req.body.id
    ])
    if(result.status=='err'){
      res.json({status:'unable'})
      return
    }
    res.json({status:'done'})
  }
  else{
    let result=await querydatabase('update student set s_credentials=? where usn=?',[
      JSON.stringify({id:req.body.id,pass:req.body.pass}),
      req.body.id
    ])
    if(result.status=='err'){
      res.json({status:'unable'})
      return
    }
    res.json({status:'done'})
  }
})

app.post('/emp_change_state',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('update employee set status=? where mobile_no=?',['onleave',req.body.id])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  result=await querydatabase('select others,current_timestamp() as timestamp from employee where mobile_no=?',[req.body.id])
  let logs=result.result[0].others
  if(!logs.hasOwnProperty('logs'))
    logs['logs']=[]
  logs.logs.push({id:req.body.id,status:'onleave',time:result.result[0].timestamp,reason:req.body.rs})
  result=await querydatabase('update employee set others=? where mobile_no=?',[JSON.stringify(logs),req.body.id])
  res.json({status:'done'})
})

app.post('/emp_change_state_gotback',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('update employee set status=? where mobile_no=?',['notactive',req.body.id])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  result=await querydatabase('select others,current_timestamp() as timestamp from employee where mobile_no=?',[req.body.id])
  let logs=result.result[0].others
  if(!logs.hasOwnProperty('logs'))
    logs['logs']=[]
  logs.logs.push({id:req.body.id,status:'notactive',time:result.result[0].timestamp,reason:'got back from leave'})
  result=await querydatabase('update employee set others=? where mobile_no=?',[JSON.stringify(logs),req.body.id])
  res.json({status:'done'})
})

app.post('/rooms_status',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select room_number,room_status from room')
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let room_meta=result.result
  result=await querydatabase('select name,room_no from student')
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  res.json({status:'done',meta:room_meta,info:result.result})
})

app.post('/rom_canbe_allocated?',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase("select usn from student where room_no=?",[req.body.room])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  for(let i of result.result){
    let room=await allocate_student(i.usn)
    if(room=='none'){
      res.json({status:'unable'})
      return
    }
  }
  res.json({status:'done'})
})

app.post('/rooms_status_block',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result= await querydatabase('select designation from employee where mobile_no=?',[req.body.id])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  if(result.result[0].designation!='Warden'){
    res.json({status:'unable'})
    return
  }
  result=await querydatabase('update room set room_status=? where room_number=?',['notavialable',req.body.room])
  result=await querydatabase('select usn from student where room_no=?',[req.body.room])
  let students=[]
    for(let i of result.result){
    students.push(i.usn)
  }
  for(let i of students){
    let room=await allocate_student(i)
    let res=await querydatabase('update student set room_no=? where usn=?',[room,i])
  }
  res.json({status:'done'})
})

app.post('/rooms_status_unblock',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result= await querydatabase('select designation from employee where mobile_no=?',[req.body.id])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  if(result.result[0].designation!='Warden'){
    res.json({status:'unable'})
    return
  }
  result=await querydatabase('update room set room_status=? where room_number=?',['available',req.body.room])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  res.json({status:'done'})
})

app.post('/students_info',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select * from fees')
  let fees=result.result
   result=await querydatabase('select * from student',[])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let obj={total:result.result.length,in:0,out:0,info:[]}
  for(let i of result.result){
    if(i.Status=='active')
      obj.in++
    else
      obj.out++
    delete i.S_credentials
    if(!fs.existsSync(`././hostel_management/src/assets/${i.USN}`))
      fs.mkdirSync(`././hostel_management/src/assets/${i.USN}`)
    if(i.Profile_pic.hasOwnProperty('pic'))
      fs.writeFileSync(`././hostel_management/src/assets/${i.USN}/${i.Profile_pic.name}`,Buffer.from(i.Profile_pic.pic,'base64'))
    i.Profile_pic=`/assets/${i.USN}/${i.Profile_pic.name}`
    if(i.others.hasOwnProperty('logs'))
      i['logs']=i.others.logs
    if(i.others.hasOwnProperty('fees'))
      i['fees']=i.others.fees
    delete i.others
    for(let j of fees){
      if(i.USN==j.usn){
        let date=new Date()
        let date2=new Date(j.due_on)
        let fee_status='Paid'
        if(date.getDate()>date2.getDate()&&date.getMonth>=date2.getMonth()&&date.getFullYear()>=date2.getFullYear()){
          fee_status='Due'
        }
        i['latest_fee']=j
        i['fee_status']=fee_status
      }
    }
    obj.info.push(i)
  }
  res.json({status:'done',data:obj})
})

app.post('/qr_login_req',async(req,res)=>{
  let result,crd
  if(req.body.mode=='1'){
     result=await querydatabase('select s_credentials from student where usn=?',[req.body.id])
     if(result.status=='err'){
      res.json({status:'unable'})
      return
     }
     crd='s_credentials'
  }
  else{
    result=await querydatabase('select e_credentials from employee where mobile_no=?',[req.body.id])
    if(result.status=='err'){
     res.json({status:'unable'})
     return
    }
    crd='e_credentials'
  }
  if(result.result.length==0){
    res.json({status:'cr'})
     return
  }
  if(result.result[0][crd].pass!=req.body.pass){
    res.json({status:'cr'})
     return
  }
  let date=new Date()
  if(req.body.mode=='1'){
    let result2=await querydatabase('select status,others from student where usn=?',[req.body.id])
    if(!result2.result[0].others.hasOwnProperty('logs'))
        result2.result[0].others['logs']=[]
    if(result2.result[0].status=='active'){
      result2.result[0].others['logs'].push({id:req.body.id,state:'out',msg:req.body.msg,date:date.toISOString()})
      let result=await querydatabase("update student set status=?,others=? where usn=?",['notactive',JSON.stringify(result2.result[0].others),req.body.id])
      login_out_mail(req.body.id,1,2)
    }
    else{
      result2.result[0].others['logs'].push({id:req.body.id,state:'in',msg:req.body.msg,date:date.toISOString()})
      let result=await querydatabase("update student set status=?,others=? where usn=?",['active',JSON.stringify(result2.result[0].others),req.body.id])
      login_out_mail(req.body.id,1,2)
    }
  }
  else{
    let result2=await querydatabase('select status,others from employee where mobile_no=?',[req.body.id])
    if(!result2.result[0].others.hasOwnProperty('logs'))
      result2.result[0].others['logs']=[]
    if(result2.result[0].status=='active'){
      result2.result[0].others['logs'].push({id:req.body.id,status:'out',reason:req.body.msg,time:date.toISOString()})
      let result=await querydatabase("update employee set status=?,others=? where mobile_no=?",['notactive',JSON.stringify(result2.result[0].others),req.body.id])
      login_out_mail(req.body.id,2,1)
    }
    else{
      result2.result[0].others['logs'].push({id:req.body.id,status:'in',reason:req.body.msg,time:date.toISOString()})
      let result=await querydatabase("update employee set status=?,others=? where mobile_no=?",['active',JSON.stringify(result2.result[0].others),req.body.id])
      login_out_mail(req.body.id,2,1)
    }
  }
  res.json({status:'done'})
})

app.post('/students_info_addstudent',imgupload.single('profile_pic'),async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.w_id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.w_id]!=req.body.w_unq){
    res.json({status:'unable'})
    return
  }
  let profile
  if(req.file){
    profile={name:req.file.filename,pic:fs.readFileSync(`./images/${req.file.filename}`).toString('base64')}
    fs.unlinkSync(`./images/${req.file.filename}`)
  }
  else{
    profile={name:'default_profile.png',pic:fs.readFileSync(`./images/defaultprofile.png`).toString('base64')}
  }
  let date=new Date()
  let others={logs:[],
    fees:[{id:req.body.usn,p_id:req.body.utr,date:date.toISOString()}],joined_on:date.toISOString()}
  let room=await allocate_student(req.body.usn)
  console.log(room)
  let pass=`stu_${Date.now()}`
  let result=await querydatabase('insert into student values(?,?,?,?,?,?,?,?,?,?,?,?,?)',[
    req.body.usn,
    req.body.name,
    req.body.ph,
    room,
    req.body.gtype,
    req.body.gname,
    req.body.email,
    'active',
    req.body.adhar,
    JSON.stringify({cl:req.body.cl,country:req.body.country,state:req.body.state,dist:req.body.state,pin:req.body.pin}),
    JSON.stringify(others),
    JSON.stringify({id:req.body.usn,pass:pass}),
    JSON.stringify(profile)
  ])
  if(result.status=='err' && result.code==1062){
    res.json({status:'dp'})
    return
  }
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let date2=new Date()
  date2.setFullYear(date2.getFullYear()+1)
  logentry(req.body.usn,req.body.name)
  let result2=await querydatabase("insert into lives_in values(?,?)",[req.body.usn,room])
  let result3=await querydatabase("insert into fees values(?,?,?,?,?)",[
    req.body.usn,
    '45000',
    `${date.toISOString()}`,
    date2.toISOString(),
    JSON.stringify({})
  ])
  let html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <H3>A heartfull welcome to aour hostel</H3>
      <p>We hope it might be a very good experience for you...</p>
      <p>Your id:> ${req.body.usn}</p>
      <p>Pass:> ${pass}</p>
  </body>
  </html>`
  let mailres=await sendmail(req.body.email,html)
  res.json({status:'done'})
})

app.post('/students_info_remove',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase("select designation from employee where mobile_no=?",[req.body.id])
  if(result.result[0].designation!='Warden'&&result.result[0].designation!='Co-warden'){
    res.json({status:'unable'})
    return
  }
  result=await querydatabase("select e_mail from student where usn=?",[req.body.usn])
  let mail= result.result[0].e_mail
  result=await querydatabase("delete from student where usn=?",[req.body.usn])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <p>We are sad to inform you that,</p>
      <h2>You have been removed from the Hostel</h2>
      <p>Hope it was a nice journey..</p>
      <p>All the best with future :)</p>
  </body>
  </html>`
  let mailres=await sendmail(mail,html)
  res.json({status:'done'})
})

app.post('/students_info_swap_room',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase("select designation from employee where mobile_no=?",[req.body.id])
  if(result.result[0].designation!='Warden'&&result.result[0].designation!='Co-warden'){
    res.json({status:'unable'})
    return
  }
  result=await querydatabase('select usn,room_no,e_mail from student where usn in(?)',[[req.body.usn1,req.body.usn2]])
  if(result.result.length<2){
    res.json({status:'nostudent'})
    return
  }
  
  let usn1_to,usn2_to,usn1_e,usn2_e
  for(let i of result.result){
    if(i.usn!=req.body.usn1){
      usn1_to=i.room_no
      usn2_e=i.e_mail
    }
    else{
      usn2_to=i.room_no
      usn1_e=i.e_mail
    }
  }
  let result2=await querydatabase('update student set room_no=? where usn=?',[usn1_to,req.body.usn1])
  if(result2.status=='err'){
    res.json({status:'nostudent'})
    return
  }
  result2=await querydatabase('update student set room_no=? where usn=?',[usn2_to,req.body.usn2])
  if(result.status=='err'){
    let result3=await querydatabase('update student set room_no=? where usn=?',[usn2_to,req.body.usn1])
    res.json({status:'nostudent'})
    return
  }
  let html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <h3>Room changed!!!</h3>
      <p>New room:> ${usn1_to}</p>
  </body>
  </html>`
  let mailres= sendmail(usn1_e,html)
  html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <h3>Room changed!!!</h3>
      <p>New room:> ${usn2_to}</p>
  </body>
  </html>`
  mailres= sendmail(usn2_e,html)
  res.json({status:'done'})
})

app.post('/students_info_change_room',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase("select designation from employee where mobile_no=?",[req.body.id])
  if(result.result[0].designation!='Warden'&&result.result[0].designation!='Co-warden'){
    res.json({status:'unable'})
    return
  }
  result=await querydatabase('select e_mail from student where usn=?',[req.body.usn])
  if(result.result.length==0){
    res.json({status:'id'})
    return
  }
  let new_room='none',email=result.result[0].e_mail
  if(req.body.room==''){
    new_room=await allocate_student(req.body.usn)
  }
  else{
    let result2=await querydatabase('select room_number from room where room_number=?',[req.body.room])
    if(result2.result.length==0){
      res.json({status:'noroom'})
      return
    }
    result2=await querydatabase("select usn from student where room_no=?",[req.body.room])
    if(result2.result.length>=3){
      res.json({status:'room'})
      return
    }
    new_room=req.body.room
  }
  if(new_room=='none'){
    res.json({status:'cant'})
    return
  }
  result=await querydatabase('update student set room_no=? where usn=?',[new_room,req.body.usn])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  sendmail(email,`new Room:>${new_room}`)
  res.json({status:'done'})
})

app.post("/employee_details_req_count",async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select count(mobile_no) as count from employee',[])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let total=result.result[0].count
  result=await querydatabase('select mobile_no from employee',[])
  let list=[]
  for(let i of result.result){
    list.push(i.mobile_no)
  }
  result=await querydatabase('select count(status) as ou_t from employee where status=?',['notactive'])
  let out=result.result[0].ou_t
  result=await querydatabase('select count(status) as i_n from employee where status=?',['active'])
  let i_n=result.result[0].i_n
  res.json({status:'done',count:total,out:out,in:i_n,list:list})
})

app.post('/employee_details_req_details',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select * from employee where mobile_no=?',[req.body.emp])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let i=result.result[0]
    delete i['E_credentials']
    if(!fs.existsSync(`./hostel_management/src/assets/${i.Mobile_No}`))
      fs.mkdirSync(`./hostel_management/src/assets/${i.Mobile_No}`)
    fs.writeFileSync(`./hostel_management/src/assets/${i.Mobile_No}/${i.Profile_pic.name}`,Buffer.from(i.Profile_pic.pic,'base64'))
    i.profile_pic=`/assets/${i.Mobile_No}/${i.Profile_pic.name}`
    delete i.Profile_pic
    if(!i.others.hasOwnProperty('logs'))
      i.others['logs']=[]
    i['logs']=i.others['logs']
    if(!i.others.hasOwnProperty('sal'))
      i.others['sal']=[]
    i['sal']=i.others['sal']
    delete i.others
  result=await querydatabase('select * from salary where mobile_no=?',[req.body.emp])
  if(result.result.length!=0){
    i['cur_sal']={amt:result.result[0].Amount,date:result.result[0].paid_on}
  }
  
  res.json({status:'done',data:i})
})

app.post('/update_sal_status',async(req,res)=>{
  console.log(req.body)
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let date =new Date()
  let curdate=date.toISOString()
  date.setMonth(date.getMonth()+3)
  let result=await querydatabase('select * from salary where mobile_no=?',[req.body.emp])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  if(result.result.length==0){
    let result2=await querydatabase('insert into salary values(?,?,?,?,?)',[
      req.body.emp,
      curdate,
      date.toISOString(),
      '60000',
      JSON.stringify({})
    ])
    if(result2.status=='err'){
      res.json({status:'unable'})
      return
    }
  }
  else{
    let result2=await querydatabase('update salary set due_on=?,paid_on=?',[date.toISOString(),curdate])
  }
  let result2=await querydatabase('select others,e_mail from employee where mobile_no=?',[req.body.emp])
    let email=result2.result[0].e_mail
    let others={id:req.body.emp,p_id:req.body.pid,date:curdate}
    let res2=result2.result[0].others
    if(!res2.hasOwnProperty('sal'))
      res2['sal']=[]
    res2['sal'].push(others)
    result2=await querydatabase('update employee set others=? where mobile_no=?',[JSON.stringify(res2),req.body.emp])
    let mailres=sendmail(email,`salery credited/npayment ID:${req.body.pid}`)
    res.json({status:'done'})
})


app.post('/req_applications',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select * from applications',[])
  let arr=[],total=0,acc=0,pending=0,rej=0
  if(!fs.existsSync('./hostel_management/src/assets/applications'))
    fs.mkdirSync(`./hostel_management/src/assets/applications`)
  for(let i of result.result){
    total++
    fs.writeFileSync(`./hostel_management/src/assets/applications/${i.app_id}_adhar.png`,Buffer.from(i.adhar.pic,'base64'))
    fs.writeFileSync(`./hostel_management/src/assets/applications/${i.app_id}_profile.png`,Buffer.from(i.profile_pic.pic,'base64'))
    i['profile_pic']=`/assets/applications/${i.app_id}_profile.png`
    i['adhar'].pic=`/assets/applications/${i.app_id}_adhar.png`
    let date2=new Date(i['datetime'])
    i['datetime']=`${date2.getDate()}-${date2.getMonth()+1}-${date2.getFullYear()}(${date2.getHours()}:${date2.getMinutes()})`
    if(i['others']['status']==1000){
      pending++
      i['others']['status']='pending'
    }
    else if(i['others']['status']==1001){
      rej++
      i['others']['status']='rejected'
    }
    else{
      acc++
      i['others']['status']='accepted'
    }
    arr.push(i)
  }
  res.json({status:'done',data:arr,total:total,acc:acc,rej:rej,pending:pending})
})

app.post('/applications_accept',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let room=await allocate_student('')
  if(room=='none'){
    res.json({status:'room'})
    return
  }
  let result
   result=await querydatabase('select * from applications where app_id=?',[req.body.app])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  if(result.result.length==0){
    res.json({status:'unable'})
    return
  }
  let student=await result.result[0]
  let email=result.result[0].email
  let result3=await querydatabase('select usn from student where usn=?',[student['collage']['usn']])
  if(result3.result.length!=0){
    res.json({status:'dp'})
    return
  }
  if(result.result[0].others['status']!=1000){
    res.json({status:'resolved'})
    return
  }
  result.result[0].others['status']=1003
  result=await querydatabase('update applications set others=? where app_id=?',[JSON.stringify(result.result[0].others),req.body.app])
  let date=new Date()
  let others={logs:[],
    fees:[],joined_on:date.toISOString()}
  console.log(room)
  let pass=`stu_${Date.now()}`
  let result2=await querydatabase('insert into student values(?,?,?,?,?,?,?,?,?,?,?,?,?)',[
    student['collage']['usn'],
    student.name,
    student.mobile,
    room,
    'father',
    student.gname,
    student.email,
    'active',
    student.adhar.no,
    JSON.stringify(student.adress),
    JSON.stringify(others),
    JSON.stringify({id:student['collage']['usn'],pass:pass}),
    JSON.stringify(student.profile_pic)
  ])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let date2=new Date()
  date2.setDate(date.getDate()+10)
  result2=await querydatabase('insert into fees values(?,?,?,?,?)',[student['collage']['usn'],'45000',date.toISOString(),date2.toISOString(),JSON.stringify({})])

  let html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
    <h3>Hurrayyyy</h3>
    <p>Your application was accepted</p>
    <p>Report as soon as possible</p>
    <p>you will have 10 days of time for the fee payment</p>
    <p>Your ID:> ${student['collage']['usn']}</p>
    <p>Your Pass:> ${pass}</p>
    <p>Room No:> ${room}</p>
</body>
</html>`
let mailres=await sendmail(email,html)
res.json({status:'done'})
})

app.post('/applications_reject',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select others,email from applications where app_id=?',[req.body.app])
  let email=result.result[0].email
  if(result.result.length==0){
    res.json({status:'unable'})
    return
  }
  if(result.result[0].others.status!=1000){
    res.json({status:'resolved'})
    return
  }
  result.result[0].others.status=1001
  result=await querydatabase('update applications set others=? where app_id=?',[JSON.stringify(result.result[0].others),req.body.app])
   let html=`<!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Document</title>
   </head>
   <body>
     <h3>Its sad news :(</h3>
     <p>Your application was Rejected</p>
 </body>
 </html>`
 let mailres=await sendmail(email,html)
 res.json({status:'done'})
})

app.post('/msgs_req',async(req,res)=>{
  let tosend={events:[],msgs:[]}
  let date=new Date()
  let result=await querydatabase('select others from hostel where stu_id=?','events')
  if(result.status=='err'){
    res.json({status:'unable'})
  }
  let obj=result.result[0].others
  if(!obj.hasOwnProperty('events'))
    tosend['events']=[]
  else{
    for(let i of obj['events']){
      let date2=new Date(i['date'])
      if(date>date2)
        i['status']='pre'
      else if(date==date2)
        i['status']='on'
      else
      i['status']=''
      tosend.events.push(i)
    }
  }
  if(req.body.mode=='m'){
    
  }
  else if(req.body.mode=='emp'){
    let result2=await querydatabase('select others from employee where mobile_no=?',[req.body.id])
    if(result2.result[0].others.hasOwnProperty('msgs')){
      tosend.msgs=result2.result[0].others['msgs']
    }
  }
  else{
    let result2=await querydatabase('select others from student where usn=?',[req.body.id])
    if(result2.result[0].others.hasOwnProperty('msgs')){
      console.log()
      tosend.msgs=result2.result[0].others['msgs']
    }
  }
  res.json({status:'done',data:tosend})
})

app.post('/online_info',(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./online.txt','utf-8'))
  res.json({status:'done',data:master.online.length})
})

app.post('/warden_prev',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){res.json({status:'unable'});return}
  res.json({status:'done'})
})

app.post('/boradcast',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'});
    return
  }
  let master=JSON.parse(fs.readFileSync('./app_ids.txt','utf-8'))
  let ev_id=master['event']++
  fs.writeFileSync('./app_ids.txt',JSON.stringify(master))
  let obj={id:ev_id,title:req.body.title,des:req.body.des,link:req.body.link,date:req.body.date}
  let result=await querydatabase('select others from hostel where stu_id=?',['events'])
  if(!result.result[0].others.hasOwnProperty('events')){
    result.result[0].others['events']=[]
  }
  result.result[0].others['events'].push(obj)
  result=await querydatabase('update hostel set others=? where stu_id=?',[JSON.stringify(result.result[0].others), 'events'])
  if(result.status=='err'){
    res.json({status:'unable'});
    return
  }
  io.emit('new_event',obj)
  let email=[]
  result=await querydatabase('select e_mail from student')
  for(let i of result.result)
    email.push(i.e_mail)
  result=await querydatabase('select e_mail from employee')
  for(let i of result.result)
    email.push(i.e_mail)
  let html=`
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <p>New Event alert!!!</p>
      <p>Title:> ${req.body.title}</p>
      <p>Date:> ${req.body.date}</p>
  </body>
  </html>`
  for(let i of email){
    // sendmail(i,html)
  }
  res.json({status:'done'});
})
app.post("/get_all_emails",async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let result=await querydatabase('select name,e_mail,usn from student',[])
  let arr=[]
  for(let i of result.result){
    i['des']='student'
    i['id']=i['usn']
    arr.push(i)
  }
  result=await querydatabase('select name,e_mail,mobile_no,Designation as des from employee',[])
  for(let i of result.result){
    i['id']=i['mobile_no']
    arr.push(i)
  }
  res.json({status:'done',data:arr})
})

app.post("/senmsg",async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  if(req.body.id==req.body.s_id){
    res.json({status:'unable'})
    return
  }
  let result
  if(req.body.des=='student'){
    result=await querydatabase('select others from student where usn=?',[req.body.s_id])
    if(result.status=='err'){
      res.json({status:'unable'})
      return
    }
  }
  else{
    result=await querydatabase('select others from employee where mobile_no=?',[req.body.s_id])
    if(result.status=='err'){
      res.json({status:'unable'})
      return
    }
  }
  if(!result.result[0].others.hasOwnProperty("msgs"))
    result.result[0].others['msgs']={warden:[],management:[]}
  let master=JSON.parse(fs.readFileSync('./app_ids.txt','utf-8'))
  let id=master['msgs']++
  fs.writeFileSync('./app_ids.txt',JSON.stringify(master))
  let obj={msgid:id,date:req.body.date,msg:req.body.msg}
  if(req.body.from=='w'){
    result.result[0].others['msgs']['warden'].push(obj)
  }
  else
  result.result[0].others['msgs']['management'].push(obj)
  if(req.body.des=='student'){
    let result2=await querydatabase('update student set others=? where usn=?',[JSON.stringify(result.result[0].others),req.body.s_id])
    if(result2.status=='err'){
      res.json({status:'unable'})
      return
    }
  }
  else{
    let result2=await querydatabase('update employee set others=? where mobile_no=?',[JSON.stringify(result.result[0].others),req.body.s_id])
    if(result2.status=='err'){
      res.json({status:'unable'})
      return
    }
  }
  let html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <p>New message alert!!!</p>
      <p>Open login -> msgs  to see</p>
  </body>
  </html>`
  let msg=sendmail(req.body.email,html)
  io.emit(`${req.body.s_id}`,{data:obj,from:req.body.from})
  res.json({status:'done'})
})
app.post('/cancel_event',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.json({status:'unable'})
    return
  }
  let html,obj
  let result=await querydatabase('select others from hostel where stu_id=?',['events'])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  for(let i in result.result[0].others['events']){
    if(result.result[0].others['events'][i].id==req.body.e_id){
      html=`<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
      </head>
      <body>
          <p>Event Canceled :(</p>
          <p>Title:> ${result.result[0].others['events'][i].title}</p>
      </body>
      </html>`
      obj=result.result[0].others['events'][i]
      result.result[0].others['events'].splice(i,1)
      break
    }
  }
  result=await querydatabase('update hostel set others=? where stu_id=?',[JSON.stringify(result.result[0].others),'events'])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  let email=[]
  result=await querydatabase('select e_mail from student')
  for(let i of result.result)
    email.push(i.e_mail)
  result=await querydatabase('select e_mail from employee')
  for(let i of result.result)
    email.push(i.e_mail)
  for(let i of email){
      // sendmail(i,html)
  }
  io.emit('event_cancel',obj)
  res.json({status:'done'})
})

app.post('/feed_backs_submit',async(req,res)=>{
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(!master.hasOwnProperty(req.body.id)){
    res.json({status:'unable'})
    return
  }
  if(master[req.body.id]!=req.body.unq){
    res.json({status:'unable'})
    return
  }
  let date=new Date()
  master=JSON.parse(fs.readFileSync('./app_ids.txt','utf-8'))
  let obj={id:++master['feedback'],msg:req.body.feed,date:date.toISOString(),from:req.body.id}
  fs.writeFileSync('./app_ids.txt',JSON.stringify(master))
  let result=await querydatabase(` UPDATE hostel
  SET others = JSON_ARRAY_APPEND(
    others,
    '$.feedback',
    CAST(? AS JSON)
  )
  WHERE stu_id=?`,[JSON.stringify(obj),'feedback'])
  if(result.status=='err'){
    res.json({status:'unable'})
    return
  }
  io.emit('new_feedback',obj)
  res.json({status:'done'})
})

app.post('/getfeedback',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.send('unable')
    return
  }
  let result=await querydatabase('select others from hostel where stu_id=?',['feedback'])
  if(result.status=='err'){
    res.send('unable')
    return
  }
  res.json({status:'done',data:result.result[0].others})
})

app.post('/st_update_fee',async(req,res)=>{
  let proceed=await checkfor_privilage_w_m(req.body.id,req.body.unq)
  if(!proceed){
    res.send('unable')
    return
  }
  let obj={id:req.body.usn,p_id:req.body.p_id,date:req.body.date}
  let result=await querydatabase('select e_mail,others from student where usn=?',[req.body.usn])
  if(result.status=='err'){
    res.send('unable')
    return
  }
  let mail=result.result[0].e_mail
  if(!result.result[0].others.hasOwnProperty('fees'))
    result.result[0].others['fees']=[]
  result.result[0].others['fees'].push(obj)
  let html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <p>Fee Payment updated</p>
      <p>Login->profile</p>
  </body>
  </html>`
  let mailres=sendmail(mail,html)
  result=await querydatabase("update student set others=? where usn=?",[JSON.stringify(result.result[0].others),req.body.usn])
  if(result.status=='err'){
    res.send('unable')
    return
  }
  let date=new Date(req.body.date)
  date.setMonth(date.getMonth()+10)
  let result2=await querydatabase('update fees set paid_on=?,due_on=? where usn=?',[req.body.date,date.toISOString(),req.body.usn])
  if(result.status=='err'){
    res.send('unable')
    return
  }
  io.emit(`st_pay_update`,obj)
  res.json('done')
})

sever.listen(2400,(e)=>{})



async function querydatabase(query,params){
  let connection
  try{
     connection=await pool.getConnection()
  }
  catch(err){
    console.log(err)
  }
  if(!connection){
    console.log(connection)
    return {status:'err',code:'connection'}
  }
  try{
    let [results,fields]=await connection.query(query,params)
    connection.release()
    return {status:'ok',result:results}
  }
  catch(err){
    console.log(err)
    return {status:'err',code:err.errno||'unknown'}
  }
}

async function logentry(id,name){
  let results=await querydatabase('insert into logs(log_id,name,others) values(?,?,?)',[id,name,JSON.stringify({})])
  if(results.status=='err')
    console.log('failed to log')
}

function generatetoken(){

}
function logintimeout(id){
  if(logintimeoutobj.hasOwnProperty(id)){
    clearTimeout(logintimeoutobj[id])
    delete logintimeoutobj[id]
  }
  let timeid=setTimeout(()=>{
    let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
    for(let i of Object.keys(master)){
      if(id=='management'&&i=='management'){
        delete master[i]
        delete logintimeoutobj[id]
        fs.writeFileSync('./login.txt',JSON.stringify(master))
      }
      if(i==id){
        delete master[i]
        delete logintimeoutobj[id]
        fs.writeFileSync('./login.txt',JSON.stringify(master))
      }
    }
  },1800000)
  Object.assign(logintimeoutobj,{[id]:timeid})
  return timeid
}

async function sendmail(id,msg){
  try{
    let mail= await mailpromise({
      from:'danjuhegde50@gmail.com',
      to:id,
      subject:'Welcome to hostel',
      html:msg
    })
    return 'okayy'
  }
  catch(err){
    return 'err'
  }
}


 function deleteallfiles(id){
  if(!fs.existsSync(`./hostel_management/src/assets/${id}`)) return
  let files=fs.readdirSync(`./hostel_management/src/assets/${id}`)
  files.forEach((file)=>{
    fs.unlinkSync(`./hostel_management/src/assets/${id}/${file}`)
  })
 }
process.on('SIGINT',()=>{
    console.log('writing')
    fs.writeFileSync('./schedules.txt',JSON.stringify(scheduler))
    // pool.end()
    process.exit()
})
function init(){
  let master=JSON.parse(fs.readFileSync('./schedules.txt','utf-8'))
  if(Object.keys(master)!=0){
    for(let i of Object.keys(master)){
      setschedule(master[i])
    }
  fs.writeFileSync('./schedules.txt',JSON.stringify({}))
}
}

//socket operations
// io.use(cors(corsOptions))
io.on('connection',(socket)=>{
  socket.on('connected_user',(data)=>{
    let master=JSON.parse(fs.readFileSync('./online.txt','utf-8'))
    if(Object.keys(master).length==0)
      master['online']=[]
    if(!master['online'].includes(data.id))
      master.online.push(data.id)
    fs.writeFileSync('./online.txt',JSON.stringify(master))
  })
  socket.on('disconnedted_user',(data)=>{
    let master=JSON.parse(fs.readFileSync('./online.txt','utf-8'))
    if(Object.keys(master).length==0){
      master['online']=[]
      return
    }
    if(master.online.includes(data.id)){
      master.online.splice(master.online.indexOf(data.id),1)
    }
    fs.writeFileSync('./online.txt',JSON.stringify(master))
  })
  socket.on('emp_status',async()=>{
    let result=await querydatabase('select status,mobile_no,name from employee')
    io.emit('emp_status_res',{data:result.result})
  })
})

async function checkinsideimage(path){
  try {
        const { data: { text } } = await Tesseract.recognize(path, 'eng');
        return {status:'okayy',text:text};
      } catch (error) {
        return {status:'err'}
      }
}
function setschedule(obj){
  let index=++scheduler_counter
  scheduler[index]=obj
  let temp=obj.time.split('-')
  cron.schedule(`01 09 ${temp[0]} ${temp[1]} *`,async()=>{
    let html=`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <p>You have scheduled a event</p>
        <p>Title:> ${obj.title}</p>
    </body>
    </html>`
    let mail=await sendmail(obj.email,html)
    delete scheduler[index]
  })
  console.log('scheduled',cron.getTasks())
}

function adaptfor_front(obj,mode){
  if(mode=='emp'){
    delete obj['E_credentials']
  }
  else
    delete obj['S_credentials']
  return obj
}


function writeupdatedfile(file,id){
  if(!fs.existsSync(`././hostel_management/src/assets/${id}`))return
  fs.writeFileSync(`././hostel_management/src/assets/${id}/${file.name}`,Buffer.from(file.pic,'base64'))
  return `/assets/${id}/${file.name}`
}

function generateotp(){
  let otp=''
  for(let i=0;i<6;i++){
    otp+=Math.floor(Math.random()*10)
  }
  return otp
}

async function allocate_student(id){
  let result=await querydatabase('select usn,room_no from student',[])
  let obj={}
  for(let i of result.result){
    if(!obj.hasOwnProperty(i.room_no)){
      obj[i.room_no]=0
    }
    obj[i.room_no]++
  }
  result =await querydatabase('select room_number,room_status from room',[])
  let check={}
  for(let i of result.result){
    check[i.room_number]=i.room_status
  }
  for(let i of Object.keys(check)){
    if(check[i]=='available'){
      if(obj.hasOwnProperty(i)){
        if(obj[i]!=3)
          return i
      }
      else{
        return i
      }
    }
  }
  return 'none'
}

async function login_out_mail(id,mode,to){
  let html,mail
  if(mode==1){
    html=`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <h3>In/Out Activity</h3>
        <p>ID:> ${id}</p>
        <p>Current State:> Out</p>
    </body>
    </html>`
  }
  else{
    html=`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <h3>In/Out Activity</h3>
        <p>ID:>${id} </p>
        <p>Current State:> In</p>
    </body>
    </html>`
  }
  if(to==1){
    let result=await querydatabase('select e_mail from employee where mobile_no=?',[id])
    mail=result.result[0].e_mail
  }
  else{
    let result=await querydatabase('select e_mail from student where usn=?',[id])
    mail=result.result[0].e_mail
  }
  await sendmail(mail,html)
}

async function checkfor_privilage_w_m(id,unq){
  let master=JSON.parse(fs.readFileSync('./login.txt','utf-8'))
  if(id=='management'){
    if(!master.hasOwnProperty('management'))
      return false
    if(master['management']!=unq)
      return false
  }
  else{
    if(!master.hasOwnProperty(id))
      return false
    if(master[id]!=unq)
      return false
    let result=await querydatabase('select designation from employee where mobile_no=?',[id])
    if(result.status=='err')
      return false
    if( result.result.length==0)
      return false
    if(result.result[0].designation!='Warden'){
      return false
    }
  }
  return true
}