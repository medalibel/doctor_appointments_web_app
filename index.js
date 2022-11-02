const express = require('express');
const bodyParser = require('body-parser');
const doctor_info = require('./doctor_info');
const dao = require('./dao');

const app = express();
app.set('view engine','ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


var clinic_insert_sql = "insert into clinic_info(doctor_id,wilaya,address,contact_num,is_working) values();"


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
        res.render('signup_test');
    });
});

app.get('/login/doctor',(req,res)=>{
    res.render('login_test');
});
app.post('/login/doctor',(req,res)=>{
    if(!req.body.email || !req.body.password){
        res.status(400).render('login_test');
    }
    else{
        dao.doctorLogIn(req.body.email,(rows)=>{
            console.log(rows);
            res.status(200).render('login_test');
        });
        
    }
});


app.listen(3000,()=>{
    console.log('server listening on port 3000');
});