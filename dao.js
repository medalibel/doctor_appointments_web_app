const sqlite = require('sqlite3').verbose();

let db = new sqlite.Database('./app_data.db',(err)=>{
    if(err)
        console.log(err);
    else
        console.log("connected to sqlitedb");
});

const isWorking=1;
const notWorking=0;

function close_connection(){
    console.log('closing sqlite connection');
    db.close();
    console.log('connection closed');
}
function getAllDoctors(){
    //selct query should not select password
    db.all('select * from doctor',(err,rows)=>{
        console.log(rows);
    });
}
function getDoctorInformation(doctor_id,callback){
    /* TODO 
        select from doctor name last_name specialty
        and from clinic all information
        and select working days
        return all this info as doctor inforamtion object
    */

    
}
function doctorLogIn(email,callback){
    let query = 'select * from doctor where email =?';
    db.all(query,email,(err,rows)=>{
        if(err){
            console.log(err);
            callback(null);
            return;
        }
        callback(rows);
    });

}
function doctorSignUp(doctor,callback){
    let query = 'INSERT INTO doctor(email,password,first_name,last_name,specialty) values(?,?,?,?,?)';
    let doc_info = [
        doctor.email,
        doctor.password,
        doctor.first_name,
        doctor.last_name,
        doctor.specialty
    ];
    db.run(query,doc_info,function (err){
        if(err){
            //Doctor account with this email already exists
            console.log(err);
            callback(null);
        }
        else{
            //doctor account created 
            //insert an empty clinic for that doctor
            var clinic_insert_sql = "insert into clinic_info(doctor_id,wilaya,address,contact_num,is_working) values(?,?,?,?,?)";
            let doctor_id = this.lastID;

            let clinic_info=[
                doctor_id,
                null,
                null,
                null,
                isWorking
            ];
            
            db.run(clinic_insert_sql,clinic_info,(clinic_err)=>{
                if(clinic_err){
                    console.log(clinic_err);
                    callback(null);
                }
                else{
                    callback(doctor_id);
                }
            })
        }
    });
}

module.exports = {
    isWorking,
    notWorking,
    close_connection,
    getAllDoctors,
    doctorLogIn,
    doctorSignUp
}