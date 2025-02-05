const express = require('express');
const logger =  require('morgan');
const ejs = require('ejs');
const keys = require('./config/keys');
const bodyParser = require('body-parser')
const db = require('./services/db')
const cookieSession = require('cookie-session');


var port = process.env.PORT || 3000;

var indexRouter = require('./Routes/index');
var userRouter = require('./Routes/user');
var authRouter = require('./Routes/auth');
var librarianRouter = require('./Routes/librarian');

const app = express();

app.use(
    cookieSession({
        maxAge : 24*60*60*1000,
        keys:[keys.cookieKey]
    })
);

app.set('view engine','ejs');

app.use(express.static('Views'));
app.set('views',__dirname+'/Views')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept");
    next();
})

app.use(logger('dev'));
app.listen(port, () => console.log(`listening tp PORT ${port}...`));

app.use('/',indexRouter);
app.use('/auth',authRouter);
app.use('/user',userRouter);
app.use('/librarian',librarianRouter);


module.exports = app;