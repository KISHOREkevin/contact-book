import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
const app = express();
const saltingRound = 10;


mongoose.connect("mongodb+srv://admin-kishore:Test123@cluster0.yhnco9i.mongodb.net/contactDB");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
const contactSchema = new mongoose.Schema({
    contactname:{
        type:String,
        required:true
    },
    contactnumber:{
        type:Number,
        required:true
    }
})
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    userpassword:{
        type:String,
        required:true
    },
    contactitems:[contactSchema]
})
const Contact = mongoose.model("Contact",contactSchema);
const User = mongoose.model("User",userSchema);
let userId=null;
let contactItems=[];
let errormsg="";
app.get("/",async (req,res)=>{
 
        res.render("login",{errormsg:errormsg});
        errormsg="";
    
})
app.get("/add-contact",async (req,res)=>{
    res.render("addContact");
});

app.get("/signin",(req,res)=>{
    res.render("signin",{errormsg:errormsg});
    errormsg="";
})
app.get("/logout",(req,res)=>{
    
    res.redirect("/");
})
app.get("/delete-account",(req,res)=>{
    res.render("deleteaccount",{errormsg:errormsg});
    errormsg="";
})
app.get("/:userId",async(req,res)=>{
    let userid = req.params.userId;
    let foundUser = await User.findById(userId);
    if(foundUser){
        userid = foundUser.id;
        res.render("home",{foundcontacts:foundUser.contactitems,username:foundUser});
    }else{
        res.redirect("/");
    }
    
    

})
app.post("/add-contact",async (req,res)=>{
    const contactName = req.body.contactName;
    const contactNumber = req.body.contactNumber;
    const contact = new Contact({
        contactname:contactName,
        contactnumber:contactNumber
    })
    try {
        let foundUser = await User.findById(userId);
        foundUser.contactitems.push(contact);
        foundUser.save();
        res.redirect("/"+userId);
    } catch (err) {
       console.log(err);
    }
    
})

app.post("/delete-contact",async (req,res)=>{
    try{
        const deleteContactId = req.body.deleteButton;
        Contact.findByIdAndRemove(deleteContactId);

        let deleteContact = await User.findByIdAndUpdate(userId,{$pull:{contactitems:{_id:deleteContactId}}});
               
       
        
        res.redirect("/"+userId);
    }catch{
        console.log(err);
    }
  
    
})
app.post("/login",async(req,res)=>{
    let logName = req.body.loginName;
    let logPassword = req.body.loginPassword;
    let foundUser= await User.findOne({username:logName});
    if(foundUser){
        bcrypt.compare(logPassword,foundUser.userpassword,(err,result)=>{
            if(err){
               console.log(err);


            }else{
                if(result===true){
                    
                    userId=foundUser.id;
                    
                    res.redirect("/"+foundUser.id);
                    
                }else{
                    errormsg="User and password mismatch !!!";
                    res.redirect("/");
                }
            }
        })
    }else{
       
        res.redirect("/");
        errormsg="User not found !!!!";
    }

})
app.post("/signin",async (req,res)=>{
    let signName = req.body.signName;
    let signPassword = req.body.signPassword;
    let foundUser = await User.findOne({username:signName});
    if(!foundUser){
        bcrypt.hash(signPassword,saltingRound,(err,hashString)=>{
            if(err){
                console.log(err);
            }else{
                const user = new User({
                    username:signName,
                    userpassword:hashString,
                    contactitems:contactItems
                })
                try {
                    user.save();
                    res.redirect("/");
                } catch (err) {
                    console.log(err);        
                }
            }
        })
    }else{
        errormsg="User with this name already exists !!!";
        res.redirect("/signin");
        
    }

   
})
app.post("/delete-account",async (req,res)=>{
    let delname = req.body.delName;
    let delPassword = req.body.delPassword;
    let foundUser = await User.findOne({username:delname});
    if(foundUser){
       await User.findByIdAndDelete(foundUser.id);
        errormsg="Account deleted successfully !!";
        res.redirect("/delete-account");
    }else{
        errormsg="User not found";
        res.redirect("/delete-account");
    }
    
    
})
app.listen(3000,()=>{
    console.log("Server started @ 3000");
})