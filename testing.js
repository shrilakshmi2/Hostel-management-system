// const sql=require("mysql2/promise")
// let fs=require('fs')
// const pool=sql.createPool({
//   host:'localhost',
//   port:'3306',
//   user:'root',
//   password:'danju@123',
//   database:'hostel_management',
// })

// async function querydatabase(query,params){
//     let connection
//     try{
//        connection=await pool.getConnection()
//     }
//     catch(err){
//       console.log(err)
//     }
//     if(!connection){
//       console.log(connection)
//       return {status:'err',code:'connection'}
//     }
//     try{
//       let [results,fields]=await connection.query(query,params)
//       connection.release()
//       return {status:'ok',result:results}
//     }
//     catch(err){
//       console.log(err)
//       return {status:'err',code:err.errno||'unknown'}
//     }
//   }
// async function Init(){
//   let obj={adhardetection:100,status:1000}
//     let res=await querydatabase('update applications set others=? where app_id=?',[
//       JSON.stringify(obj),
//       'application_2001'
//     ])
//     console.log(res.result)
// }
// let date=new Date()
// let date2=new Date()
// date2.setFullYear(date2.getFullYear()+1)
// Init()
console.log('meet me now,i want to talk to you urgently'.length);