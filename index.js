const express = require('express');
const bodyParser = require('body-parser');
const sessions = require('express-session');
const cookie_parser = require('cookie-parser');
const sqlite = require('sqlite3').verbose();

let db = new sqlite.Database('./app_data.db',(err)=>{
    if(err)
        console.log(err);
    else
        console.log("connected to sqlitedb");
});

const doctor_info = require('./doctor_info');
const doctor_dao = require('./dao/doctor_dao');

const app = express();
app.set('view engine','ejs');

const oneDay = 1000*60*60*24;
const doctor_account = "doctor_account";
const client_account = "client_account";

app.set('trust proxy', 1);
app.use(sessions({
    secret:'$this&is&my&secret&key$',
    saveUninitialized:true,
    cookie:{
        secure:false,
        maxAge:oneDay
    },
    resave: false
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cookie_parser());



var  doctorSessionChecker = (req,res,next) => {
    console.log('session checker : '+req.session.id);
    console.log(req.session);
    if(req.session.profile){
        if(req.session.profile.type == doctor_account){
            console.log('found user session');
            next();
        }
        else{
            console.log('only allowed for doctor accounts ');
            res.redirect('/');
        }
    }else{
        console.log('session not found');
        res.redirect('/doctor/login');
    }
}


app.get('/',(req,res)=>{
    res.render('index');
});
app.get('/signup',(req,res)=>{
    //res.render('accounttype')
});
app.get('/login',(req,res)=>{
    res.render('accountselection')
});

app.get('/doctor/signup',(req,res)=>{
    if(req.session.profile){
        res.redirect('/doctor/account');
        return;
    }
    res.render('signup_test');
});
app.post('/doctor/signup',(req,res)=>{
    let doctor={
        first_name:req.body.first_name,
        last_name:req.body.last_name,
        email:req.body.email,
        password:req.body.password,
        specialty:req.body.specialty
    }
    doctor_dao.doctorSignUp(db,doctor,(doctor_id)=>{
        console.log(doctor_id);
        if(doctor_id != null){
            console.log('signed up successfuly');
            req.session.profile = {
                id:doctor_id,
                type:doctor_account
            };
            res.redirect('/doctor/account');
        }
        else{
            console.log('error signing up');
            res.status(400).render('signup_test');
        }
    });
});

app.get('/doctor/login',(req,res)=>{
    if(req.session.profile){
        res.redirect('/doctor/account');
        return;
    }
    res.render('login_test');
});
app.post('/doctor/login',(req,res)=>{
    
    let email = req.body.email;
    let password = req.body.password;
    if(!email || !password){
        console.log('email and password required');
        res.status(400).render('login_test');
    }
    else{
        doctor_dao.doctorLogIn(db,email,(rows)=>{
            if(rows == null || rows.length ==0){
                console.log('no account with this email');
                res.status(400).render('login_test');
            }
            else{
                let account = rows[0];
                if(account.password == password){
                    var profile = {
                        id : account.id,
                        type : doctor_account
                    };
                    
                    req.session.profile = profile;
                    res.redirect('/doctor/account');
                }
                else{
                    console.log('wrong password');
                    res.status(400).render('login_test');   
                }
                
            }
            
        });
        
    }
});

app.get('/doctor/account',doctorSessionChecker,(req,res)=>{
    //get profile info from session and show it in the profile page
    doctor_dao.getDoctorInformation(db,req.session.profile.id,(docInfo)=>{
        console.log(docInfo);
        //res.send(doc_info);
        res.render('doctor_profile',{workingDays : docInfo.working_days});
    });
    //console.log(req.session.profile);
    //res.render('doctor_profile_test');
});
app.get('/doctor/account/information',doctorSessionChecker,(req,res)=>{
    let id = req.session.profile.id;
    doctor_dao.getDoctorInformation(db,id,(doc_info)=>{
        res.status(200).send(doc_info);
    });
});
app.post('/doctor/clinic',doctorSessionChecker,(req,res)=>{

    let clinic_info={
        wilaya : req.body.wilaya,
        address : req.body.address,
        contact_num : req.body.contact_num,
        working_status : req.body.working_status,
        avg_time : req.body.avg_time
    };
    console.log(clinic_info);
    if(!isWorkingStatusValid(clinic_info.working_status) || !isWilayaValid(clinic_info.wilaya)){
        console.log('invalid working status or wilaya !!!!');
            
        res.status(500).send({
            error:'enter a valid working status or wilaya'
        });
        return;
    }
    clinic_info.wilaya = Number(clinic_info.wilaya);
    clinic_info.working_status = Number(clinic_info.working_status);
    console.log(clinic_info);
    
    let doctor_id = req.session.profile.id;
    doctor_dao.updateClinicInfo(db,doctor_id,clinic_info,(err)=>{
        if(err){
            console.log('could not update clinic info');
            res.status(500).send({
                error:'error while updating clinic info'
            });
        }else{
            res.status(200).send({
                result:'ok'
            });
        }
    });
});
app.post("/doctor/password",doctorSessionChecker,(req,res)=>{
    var id = req.session.profile.id;
    var oldPass = req.body.old_pass;
    var newPass = req.body.new_pass;
    if(!oldPass || !newPass){
        res.status(500).send({
            error:"input values are required"
        });
        return;
    }
    doctor_dao.changePassword(db,id,oldPass,newPass,(err)=>{

        if(err){
            console.log(err);
            res.status(400).send({
                error:"wrong password"
            });
            return;
        }
        res.status(200).send({
            result:"ok"
        });
        
    });
});

app.post('/doctor/workingdays/add',doctorSessionChecker,(req,res)=>{

    var day_id = req.body.day_id;
    var start = req.body.start;
    var finish = req.body.finish;
    console.log(req.body);
    var working_day = {
        day_id,
        start,
        finish
    };
    var doc_id = req.session.profile.id;
    doctor_dao.addWorkingDay(db,doc_id,working_day,(err)=>{
        if(err){
            console.log(err);
            res.status(400).send({
                error:"wrong day or day exists"
            });
            return;
        }
        res.status(201).send({
            result:'ok'
        });
    });

});
app.get('/doctor/workingdays/delete/:id',doctorSessionChecker,(req,res)=>{
    var doc_id = req.session.profile.id;
    var day_id = req.params.id;
    console.log('trying to delete '+day_id);
    doctor_dao.deleteWorkingDay(db,doc_id,day_id,(err)=>{
        if(err){
            console.log(err);
            res.status(400).send({
                error:"wrong day or day does not exist"
            });
            return;
        }
        res.status(200).send({
            result:'ok'
        });

    });

});
app.get('/doctor/workingdays/update/:id',doctorSessionChecker,(req,res)=>{
    var doc_id = req.session.profile.id;
    var day_id = req.params.id;
    doctor_dao.getWorkingDay(db,doc_id,day_id,(err,day)=>{
        if(err){
            console.log(err);
            res.status(400).send({
                error:"no day with given id"
            });
            return;
        }
        res.render('update_workingday',{day : day});
    });
    
});
app.post('/doctor/workingdays/update',doctorSessionChecker,(req,res)=>{
    var dayInfo = {
        day_id: req.body.day_id,
        start: req.body.start,
        finish: req.body.finish
    }
    var doc_id = getProfileId(req);
    doctor_dao.updateWorkingDay(db,doc_id,dayInfo,(err)=>{
        if(err){
            console.log(err);
            res.status(400).send({
                error:"no day with given id"
            });
            return;
        }
        res.redirect('/doctor/account');
    });
});

function isWorkingStatusValid(status){
    let s = Number(status);
    if(s === doctor_dao.isWorking || s === doctor_dao.notWorking)
        return true;
    else
        return false;
}
function isWilayaValid(wilaya){
    let w = Number(wilaya);
    if(w >0 && w <59)
        return true;
    
    return false;
}
function getProfileId(req){
    return req.session.profile.id;
}
app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(!err)
            console.log('logged out and session destroyed');
    });
    res.redirect('/doctor/login');
});

app.listen(3000,()=>{
    console.log('server listening on port 3000');
});