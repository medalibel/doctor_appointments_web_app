const express = require('express');
const bodyParser = require('body-parser');
const sessions = require('express-session');
const cookie_parser = require('cookie-parser');

const doctor_info = require('./doctor_info');
const dao = require('./dao');

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
        res.redirect('/login/doctor');
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

app.get('/signup/doctor',(req,res)=>{
    res.render('signup_test');
});
app.post('/signup/doctor',(req,res)=>{
    let doctor={
        first_name:req.body.first_name,
        last_name:req.body.last_name,
        email:req.body.email,
        password:req.body.password,
        specialty:req.body.specialty
    }
    dao.doctorSignUp(doctor,(doctor_id)=>{
        console.log(doctor_id);
        if(doctor_id != null){
            console.log('signed up successfuly');
            req.session.profile = {
                id:doctor_id,
                type:doctor_account
            };
            res.redirect('/account/doctor');
        }
        else{
            console.log('error signing up');
            res.status(400).render('signup_test');
        }
    });
});

app.get('/login/doctor',(req,res)=>{
    res.render('login_test');
});
app.post('/login/doctor',(req,res)=>{
    let email = req.body.email;
    let password = req.body.password;
    if(!email || !password){
        console.log('email and password required');
        res.status(400).render('login_test');
    }
    else{
        dao.doctorLogIn(email,(rows)=>{
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
                    res.redirect('/account/doctor');
                }
                else{
                    console.log('wrong password');
                    res.status(400).render('login_test');   
                }
                
            }
            
        });
        
    }
});

app.get('/account/doctor',doctorSessionChecker,(req,res)=>{
    //get profile info from session and show it in the profile page
    console.log('logged in as '+req.session.profile.type);
    dao.getDoctorInformation(req.session.profile.id,(doc_info)=>{
        console.log(doc_info);
        res.send(doc_info);
    });
    //console.log(req.session.profile);
    //res.render('doctor_profile_test');
});

app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(!err)
            console.log('logged out and session destroyed');
    });
    res.redirect('/login/doctor');
});

app.listen(3000,()=>{
    console.log('server listening on port 3000');
});