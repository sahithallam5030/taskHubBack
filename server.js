const exp=require('express');
const app=exp();
const expressAsyncHandler=require('express-async-handler');
const bcryptjs=require('bcryptjs')
const jwt=require('jsonwebtoken');
const cors=require('cors');
require('dotenv').config();
app.use(exp.json());
app.use(cors())
const mclient=require('mongodb').MongoClient;
mclient.connect(process.env.DATABASE_URL)
.then((client)=>{
    let database=client.db('todolist');
    let usercollection=database.collection('userdata');
    app.set('usercollection',usercollection);
    
    console.log("Database connection success");
})
.catch((error)=>{
    console.log("Error in connection to database",error);
})
app.get('/',(request,response)=>{
    response.send({message:"Database connection success"});
})
app.post('/create-user',expressAsyncHandler(async(request,response)=>{
    let usercollection=request.app.get('usercollection');
    let userObj=request.body;
    let userOfDb=await usercollection.findOne({username:userObj.username});
    if(userOfDb===null){
        //not present
        let hashpswd=await bcryptjs.hash(userObj.password,6);
        userObj.password=hashpswd;
        //create tasklist
        userObj.tasklist=[];
        await usercollection.insertOne(userObj);
        response.send({message:"Account Created Successfully"});
    }
    else{
        //present in database
        response.send({message:"Username already exists"});
    }
}))
app.post('/login',expressAsyncHandler(async(request,response)=>{
    let usercollection=request.app.get('usercollection');
    let userObj=request.body;
    let userOfDb=await usercollection.findOne({username:userObj.username});
    if(userOfDb===null){
        response.send({message:"Invalid username"});
    }
    else{
        //check whether password is correct or not
        let status=await bcryptjs.compare(userObj.password,userOfDb.password);
        if(status===true){
            let token=jwt.sign(userObj,process.env.SECRET_KEY,{expiresIn:60});
            response.send({message:"Login Success",payload:token,userObj:userOfDb});
        }
        else{
            response.send({message:"Incorrect password"});
        }
    }
}))
app.post('/update',expressAsyncHandler(async(request,response)=>{
    let usercollection=request.app.get('usercollection');
    let userObj=request.body;
    let username=userObj.username;
    let todolist=userObj.tasklist;
    await usercollection.updateOne({username:username},{$set:{tasklist:todolist}});
    response.send({message:"Update Success"});
}))
app.listen(process.env.PORT,()=>{
    console.log("Server listening to port",process.env.PORT);
})