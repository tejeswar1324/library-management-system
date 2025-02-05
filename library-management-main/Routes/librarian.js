const router = require('express').Router();
const db = require('../services/db');
const bcrypt = require('bcrypt');
const keys = require('../config/keys');

function checkLoginLibrarian(req,res){
    if(req.session.librarianKey != keys.librariankey){
        res.redirect('../auth/logout');
    }
}

function checkError(error,res){
    if(error){
        console.log({success:false,message:'database error',err:error});
        res.render('error.ejs',{
            message:'database error',
            error:error
        });
    }
}

async function addUser(req,res){
    const password = req.body.password;
    const encryptedPassword = await bcrypt.hash(password,keys.saltRounds);

    let address = req.body.address ? req.body.address != undefined : null;

    let phone_number = req.body.phone_number ? req.body.phone_number!=undefined : null;

    var user = {
        "email":req.body.email,
        "password":encryptedPassword,
        "name":req.body.name,
        "user_id" :req.body.user_id,
        "phone_number":phone_number,
        "address":address,
        student:req.body.student
    }
    var query = 'INSERT INTO user SET ?';
    db.query(query,user,(err,results,fields) => {
        checkError(err,res);
        res.render('librarianHome.ejs')
    })
}

router.get('/',(req,res) => {
    checkLoginLibrarian(req,res);
    let librarian_id = req.session.librarian_id;
    res.render('librarianHome.ejs');
})

router.post('/addBook',(req,res) => {
    checkLoginLibrarian(req,res);

    var query = 'INSERT INTO `book` SET ?'

    var post = {
        book_id : req.body.book_id,
        ISBN : req.body.ISBN,
        title : req.body.title,
        copy_number : req.body.copy_number,
        shelf_id : req.body.shelf_id,
        row_number : req.body.row_number,
        author_id : req.body.author_id
    }

    db.query(query,post,(err,result) => {
        checkError(err,res);
        res.render('librarianHome.ejs');
    });
})

router.delete('/deleteBook',(req,res) => {
    checkLoginLibrarian(req,res);

    var query = 'DELETE FROM `book` WHERE `book_id` = '+ req.body.book_id;
    db.query(query,(err,result,fileds) => {
        checkError(err,res);
        res.render('librarianHome.ejs');
    });
})

router.put('/issueBook',(req,res) => {
    checkLoginLibrarian(req,res);

    let query = 'SELECT SUM(`fine_amount`) AS total_fine FROM `fine` WHERE `user_id` = '+req.body.user_id+' GROUP BY user_id';
    let fine_amount,status,overdue;
    db.query(query,(err,result) =>{
        checkError(err,res);
        if(result.length != 0){
            fine_amount = result[0].total_fine;
        }
        else{
            fine_amount = 0;
        }
    })
    
    query = 'SELECT status,holder_id FROM book WHERE book_id = '+req.body.book_id;

    let holder;

    db.query(query,(err,result) => {
        checkError(err,res);
        status = result[0].status;
        holder = result[0].holder_id;
    });

    query = 'SELECT user.user_id FROM (book INNER JOIN user ON user.user_id = book.borrowed_id) WHERE user.user_id = '+req.body.user_id +' AND DATEDIFF(borrowed_date,CURRENT_DATE()) > 10';



    db.query(query,(err,result) => {
        checkError(err,res);
        overdue = result.length > 0;
    })

    query = 'UPDATE `book` SET ? WHERE book_id = '+req.body.book_id;

    var post = {
        borrowed_date:new Date(),
        borrowed_id:req.body.user_id,
        status: "on loan",
        holder_id : null,
        hold_date : null
    }

    if(fine_amount > 20){
        res.redirect('/librarian');
    }
    else if(status == 'on loan'){
        res.redirect('/librarian');
    }
    else if(status == 'on hold' && holder != req.body.user_id){
        res.redirect('/librarian');
    }
    else if(overdue){
        res.redirect('/librarian');
    }
    else{
        db.query(query,post,(err,result,fields) => {
            checkError(err,res);
            res.redirect('/librarian');
        });
    }
})

router.put('/returnBook',(req,res) => {
    checkLoginLibrarian(req,res);

    let query = 'SELECT DATEDIFF(borrowed_date,CURRENT_DATE()) AS days,borrowed_id,holder_id FROM book WHERE book_id = '+req.body.book_id;

    let days = 0,user_id;
    db.query(query,(err,result) => {
        checkError(err,res);
        if(result[0].days > 10){
            days = result[0].days -10;
        }
        user_id = result[0].borrowed_id;
    })

    let post;

    if(days>0){
        query = 'INSERT INTO fine SET ?';
        post = {
            user_id : user_id,
            fine_amount : 2*days,
            book_id : req.body.user_id
        }

        db.query(query,(err,result) => {
            checkError(err,res);
        })
    }

    query = 'UPDATE book SET ? WHERE book_id = '+req.body.book_id;

    let stat;

    if(holder_id == null){
        stat = 'Available';
    }
    else{
        stat = 'on hold';
    }

    post = {
        borrowed_date : null,
        borrowed_id : null,
        status : stat
    }

    db.query(query,post,(err,result,fields) => {
        checkError(err,res);
        res.redirect('/librarian/');
    })


});

router.get('/checkfine',(req,res) => {
    checkLoginLibrarian(req,res);

    let query = 'SELECT SUM(`fine_amount`) AS total_fine FROM `fine` WHERE `user_id` = '+req.body.user_id+' GROUP BY user_id';

    let fine_amount = 0;

    db.query(query,(error,result) => {
        checkError(error,res);
        if(result.length > 0){
            fine_amount = result[0].total_fine;
        }
        
        res.render('librarianHome.ejs');
    })
})

router.delete('/clearfine',(req,res) => {
    checkLoginLibrarian(req,res);

    let query = 'DELETE FROM fine WHERE user_id = '+ req.body.user_id;

    db.query(query,(err,result) => {
        checkError(err,res);
        res.render('librarianHome.ejs');
    })

})

router.post('/addUser',(req,res) => {
    checkLoginLibrarian(req,res);
    addUser(req,res)
    .then(() => {
        return;
    })
    .catch((error) => {
        //console.log(error);
        res.render('error.ejs',{
            message:'database error',
            error:error
        });
    })
})

router.put('/changePassword',(req,res) => {
    checkLoginLibrarian(req,res);

    let old_password = req.body.old_password;
    let new_password = req.body.new_password;

    let query = 'SELECT password FROM librarian WHERE librarian_id = '+req.session.librarian_id;

    let old_password_db;

    db.query(query,(err,result) => {
        checkError(err,res);
        old_password_db = result[0].password;

        bcrypt.compare(old_password,old_password_db)
        .then((same_old) => {
            if(!same_old){
                res.render('librarianHome.ejs')
            }
            else{
                let encryptedPassword;
                query = 'UPDATE librarian SET ?';
        
                bcrypt.hash(new_password,keys.saltRounds)
                .then((password) => {
                    encryptedPassword = password;
                    let post = {
                        password : encryptedPassword
                    }
            
                    db.query(query,post,(err,result) => {
                        checkError(err,res);
                        res.render('librarianHome.ejs');
                    })
                })
                .catch((error) => {
                    res.render('error.ejs',{
                        message:"internal error",
                        error:error
                    });
                })
            }
        })
        .catch((error) => {
            res.render('error.ejs',{
                message:"internal error",
                error:error
            });
        })
    });
      
})

router.get('/searchBook/',(req,res) => {
    checkLoginLibrarian(req,res);

    var criterion = req.query.criterion;
    var keyword = req.query.keyword;

    console.log(criterion);
    console.log(keyword);

    if(criterion == 'name'){
        
        let query = "SELECT * FROM (book INNER JOIN author ON book.author_id = author.author_id) WHERE title LIKE '%"+keyword+"%'";

        db.query(query,(error,result) => {
            checkError(error,res);
            console.log(result);
            res.render('booksearch.ejs',{
                books:result,
                librarian:true
            });
        })
    }
    else if(criterion == 'ISBN'){
        let query = "SELECT * FROM (book INNER JOIN author ON book.author_id = author.author_id) WHERE ISBN LIKE '%"+keyword+"%'";

        db.query(query,(error,result) => {
            checkError(error,res);
            console.log(result);
            res.render('booksearch.ejs',{
                books:result,
                librarian : true
            });
        })
    }
    else if(criterion == 'author'){
        let query = "SELECT * FROM (book INNER JOIN author ON book.author_id = author.author_id) WHERE EXISTS (SELECT author_id FROM author WHERE author.author_id = book.author_id AND author.name LIKE '%"+keyword+"%')";
        
        db.query(query,(error,result) => {
            checkError(error,res);
            console.log(result);
            res.render('booksearch.ejs',{
                books:result
            });
        })
    }
})

module.exports = router;