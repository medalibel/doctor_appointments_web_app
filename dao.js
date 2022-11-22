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
    
    let query = "select doctor.id, doctor.email, doctor.first_name, doctor.last_name, doctor.specialty, clinic_info.wilaya, clinic_info.address, clinic_info.contact_num,clinic_info.working_status,clinic_info.avg_time"+
        " FROM doctor INNER JOIN clinic_info ON doctor.id = clinic_info.doctor_id WHERE doctor.id =?";
    db.all(query,doctor_id,(err,rows)=>{
        if(err){
            console.log(err);
            callback(null);
        }
        else{
            let days_query = 'select day,start,finish from working_days where doctor_id=?';
            db.all(days_query,doctor_id,(days_err,days)=>{
                if(days_err){
                    console.log(days_err);
                    callback(null);
                }
                else{
                    let doc_info = rows[0];
                    doc_info.working_days = days;
                    callback(doc_info);
                }
            });
            
        }
    });
    
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
            var clinic_insert_sql = "insert into clinic_info(doctor_id,wilaya,address,contact_num,working_status,avg_time) values(?,?,?,?,?,?)";
            let doctor_id = this.lastID;

            let clinic_info=[
                doctor_id,
                null,
                null,
                null,
                isWorking,
                null
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

function updateClinicInfo(doctor_id,clinic_info,callback){
    let update_query = "update clinic_info set wilaya =?,address=?,contact_num=?,working_status=?,avg_time=? where doctor_id=?";
    let update_data = [
        clinic_info.wilaya,
        clinic_info.address,
        clinic_info.contact_num,
        clinic_info.working_status,
        clinic_info.avg_time,
        doctor_id
    ];
    db.run(update_query,update_data,(err)=>{
        if(err){
            console.log(err);
            callback(err);
            return;
        }
        console.log('clinic info updated succeffuly');
        callback(null);
    });

}

module.exports = {
    isWorking,
    notWorking,
    close_connection,
    getAllDoctors,
    doctorLogIn,
    doctorSignUp,
    getDoctorInformation,
    updateClinicInfo,
    changePassword,
    addWorkingDay,
    updateWorkingDay,
    deleteWorkingDay
}