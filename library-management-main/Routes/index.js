var express = require('express');
var router = express.Router();
var db = require('../services/db');

function checkError(err,res){
	if(err){
		console.log(err);
		res.send({success:false,message:'database error',err:err});
	}
}

function sendQuery(Query,res,fileName){
	db.query(Query, function (err, result, fields) {
		checkError(err,res)
		// console.log(result);
	    res.render(fileName,{result:result,role:'general'});
	});
}

router.get('/',(req,res) => {
    res.render('home.ejs');
})


module.exports = router;