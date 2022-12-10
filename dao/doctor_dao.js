const isWorking=1;
const notWorking=0;

function getAllDoctors(db,callback){
    //selct query should not select password or other private data
    let query = "select doctor.id, doctor.first_name, doctor.last_name, doctor.specialty, clinic_info.wilaya, clinic_info.address, clinic_info.contact_num,clinic_info.working_status"+
        " FROM doctor INNER JOIN clinic_info ON doctor.id = clinic_info.doctor_id";
    db.all(query,(err,rows)=>{
        if(err){
            callback(err,null);
            return;
        }
        callback(null,rows);
    });
}
function getDoctorSchedule(db,doc_id,callback){
    let days_query = 'select working_days.day_id, days.day, working_days.start, working_days.finish from '
    +'working_days inner join days where working_days.day_id = days.id and working_days.doctor_id=? order by day_id ASC';
    db.all(days_query,doc_id,(err,days)=>{
        if(err){
            callback(err,null);
        }
        else{
            callback(null,days);
        }
    });
}

function getDetailedDoctorData(db,docId,callback){
    let query = "select doctor.id, doctor.first_name, doctor.last_name, doctor.specialty, clinic_info.wilaya, clinic_info.address, clinic_info.contact_num,clinic_info.working_status"+
        " FROM doctor INNER JOIN clinic_info ON doctor.id = clinic_info.doctor_id WHERE doctor.id =?";
    db.all(query,docId,(err,docs)=>{
        if(err){
            callback(err,null);
        }
        else{
            let days_query = 'select days.day, working_days.start, working_days.finish FROM '
            +'working_days inner join days where working_days.day_id = days.id and working_days.doctor_id=? order by day_id ASC';
            db.all(days_query,docId,(daysErr,days)=>{
                if(days_err){
                    callback(daysErr,null);
                }
                else{
                    let doc_info = docs[0];
                    doc_info.working_days = days;
                    callback(null,doc_info);
                }
            });
            
        }
    });
}

function getDoctorInformation(db,doctor_id,callback){
    
    let query = "select doctor.id, doctor.email, doctor.first_name, doctor.last_name, doctor.specialty, clinic_info.wilaya, clinic_info.address, clinic_info.contact_num,clinic_info.working_status,clinic_info.avg_time"+
        " FROM doctor INNER JOIN clinic_info ON doctor.id = clinic_info.doctor_id WHERE doctor.id =?";
    db.all(query,doctor_id,(err,rows)=>{
        if(err){
            console.log(err);
            callback(null);
        }
        else{
            let days_query = 'select working_days.day_id, days.day, working_days.start, working_days.finish from '
            +'working_days inner join days where working_days.day_id = days.id and working_days.doctor_id=? order by day_id ASC';
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
function doctorLogIn(db,email,callback){
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
function doctorSignUp(db,doctor,callback){
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

function updateClinicInfo(db,doctor_id,clinic_info,callback){
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
function changeWorkingStatus(db,id,status,callback){
    let sql = 'update clinic_info set working_status = ? where doctor_id = ?';
    db.run(sql,[status,id],(err)=>{
        if(err){
            callback(err);
            return;
        }
        callback(null);
    });
}

function changePassword(db,id,oldPass,newPass,callback){
    var select = "select password from doctor where id=?";
    
    db.get(select,[id],(err,row)=>{
        if(err){
            callback(err);
            return;
        }
        if(!row){
            callback({
                error:"no doctor with the given id"
            });
            return;
        }
        if(oldPass !== row.password){
            callback({
                error:"wrong password"
            });
            return;
        }
        let sql = 'update doctor set password =? where id=? and password=?';
        let password_data = [
            newPass,
            id,
            oldPass
        ];
        db.run(sql,password_data,(err)=>{
            if(err){
                callback(err);
                return;
            }
            callback(null);
        });
    });

    
}
function addWorkingDay(db,id,workingDay,callback){
    let sql = 'insert into working_days values(?,?,?,?)';
    let data = [
        id,
        workingDay.day_id,
        workingDay.start,
        workingDay.finish
    ];
    db.run(sql,data,(err)=>{
        if(err){
            callback(err);
            return;
        }
        console.log('day added '+workingDay.day_id);
        callback(null);
    });
}
function deleteWorkingDay(db,doc_id,day_id,callback){
    let sql = 'delete from working_days where doctor_id=? and day_id=?';
    let data=[
        doc_id,
        day_id
    ];
    db.run(sql,data,(err)=>{
        if(err){
            callback(err);
            return;
        }
        console.log('day ' +day_id+' deleted');
        callback(null);
    });
}
function updateWorkingDay(db,doc_id,workingDay,callback){

    let sql = 'update working_days set start=?,finish=? where doctor_id=? and day_id=?';
    let data = [
        workingDay.start,
        workingDay.finish,
        doc_id,
        workingDay.day_id
    ];
    db.run(sql,data,(err)=>{
        if(err){
            callback(err);
            return;
        }
        console.log('day updated '+workingDay.day_id);
        callback(null);
    });
}
function getWorkingDay(db,doc_id,day_id,callback){
    let days_query = 'select working_days.day_id,days.day,working_days.start,working_days.finish from '
            +'working_days inner join days where working_days.day_id = days.id and working_days.doctor_id=? and days.id=?';
            db.all(days_query,[doc_id,day_id],(err,days)=>{
                if(err){
                    callback(err,null);
                    return;
                }
                callback(null,days[0]);
            });
}

module.exports = {
    isWorking,
    notWorking,
    getAllDoctors,
    doctorLogIn,
    doctorSignUp,
    getDoctorInformation,
    updateClinicInfo,
    changeWorkingStatus,
    addWorkingDay,
    deleteWorkingDay,
    updateWorkingDay,
    changePassword,
    getWorkingDay,
    getDoctorSchedule
}