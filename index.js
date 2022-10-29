const express = require('express');
const doctor_info = require('./doctor_info');
const dao = require('./dao');

dao.getAllDoctors();
dao.close_connection();

const app = express();
app.set('view engine','ejs');

app.use(express.static("public"));


var doctor_insert_sql = "insert into doctor(email,password,first_name,last_name,specialty) values(doctor@gmail.com,doctor,med,belkhir,cardiology);"
var clinic_insert_sql = "insert into clinic_info(doctor_id,wilaya,address,contact_num,is_working) values();"


app.get('/',(req,res)=>{
    res.render('index');
});
app.get('/signup',(req,res)=>{
    //res.render('accounttype')
});
app.get('/login',(req,res)=>{
    //res.render('accounttype')
});

app.post('/signup/doctor',(req,res)=>{

});

app.get('/signup/doctor',(req,res)=>{
    //res.render('doctorsignup')
});