const sql = require('mysql');

const db = sql.createConnection({
    host:"localhost",
    user:"lokesh",
    password:"123456",
    database:"library database"
});


db.connect((err) => {
    if(err){
        console.log("Make sure the database server is running and credentials given are correct in db.js");
        console.log(err);
    }
    else{
        console.log('connected to mysql database !!!');

    }
})

module.exports = db;