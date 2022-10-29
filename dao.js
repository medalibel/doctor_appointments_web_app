const sqlite = require('sqlite3').verbose();

let db = new sqlite.Database('./app_data.db',(err)=>{
    if(err)
        console.log(err);
    else
        console.log("connected to sqlitedb");
});



function close_connection(){
    console.log('closing sqlite connection');
    db.close();
    console.log('connection closed');
}
function getAllDoctors(){
    db.all('select * from doctor',(err,rows)=>{
        console.log(rows);
    });
}

module.exports = {
    close_connection,
    getAllDoctors
}