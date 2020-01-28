const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
const client  = redis.createClient();
const router = express.Router();
const app = express();
var pug = require('pug');
const multer = require('multer');
const path = require('path')
const crypto = require('crypto');
  

var MongoClient = require('mongodb').MongoClient;
var myurl = 'mongodb://localhost:27017/practice';
var dbo;
MongoClient.connect(myurl, (err, client) => {
  if (err) return console.log(err)
  dbo = client.db('practice');
});


//MIDDLEWARES
app.use(session({
    secret: 'ssshhhhh',
    // create new redis store.
    store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl : 260}),
    saveUninitialized: false,
    resave: false
}));

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/newViews'));
app.use('/', router);
app.set('views',__dirname+'/newviews')
app.set('view engine', 'pug')


// functions

var dbinsert = function(coll, myobj)
{
    dbo.collection(coll).insert(myobj, function(err){
        if(err) throw err;
        return ;
    })
}


// photo upload

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'newViews/uploads')
    },
    filename: function (req, file, cb) {
        // var extension = path.extname(file.originalname);
        // cb(null, file.fieldname + '-' + Date.now()+extension);

        crypto.pseudoRandomBytes(16, function(err, raw) {
          if (err) return callback(err);
                                                        
          cb(null, raw.toString('hex') + path.extname(file.originalname));
      });
    }
  })
   
  var upload = multer({ storage: storage })



//ROUTERS
router.get('/',(req,res) => {
    let sess = req.session;
    if(sess.username) {
        return res.redirect('/feed');
    }
    // res.sendFile('index.html');
    res.render('index');
});

router.get('/signup',(req, res)=>{
    res.render('signup2')
});


router.post('/signup_done',(req,res)=>{
    console.log(req.body)
    name = req.body.name;
    email = req.body.email;
    username = req.body.username;
    password = req.body.pass;
    var check = false
    dbo.collection('User').find({username:username}).toArray(function(err, data){
        if(err) throw err;
        console.log(data.length)
        if(data.length == 0)
        {
            var myobj = {name:name, email:email, username:username, password:password};
            dbo.collection('User').insertOne(myobj,function(err, result){
            if(err) throw err;
            console.log('user registered successfully');
            res.redirect('/')
            });
    
            // res.redirect("/")
        }
        else
            console.log('user already exist')

        // console.log(result);
    });

});
    


router.post('/login',(req,res) => {
    var username = req.body.username
    dbo.collection('User').find({username},{projection:{_id:0}}).toArray((err,result)=>{
        if(result.length>0)
        {
            console.log(result[0].password)
            if(result[0].password == req.body.password)
            {
                req.session.username = req.body.username;
                // req.session.email = req.body.email;
                req.session.password = req.body.password;
                console.log(`${req.session.username}'s session started`);
                res.redirect('/feed');
            }
            else
            {
                console.log('password is incorrect');
                res.redirect('/')
            }
        }
        else
        {
            console.log('user doesn\'t exist')
            res.redirect('/')
        }
    })
    

    
});

router.get('/feed',(req,res) => {
    if(req.session.username) 
    {

        dbo.collection('Images').find({}, {projection:{_id:0}}).toArray(function(err,result){
            if(err) throw err;
            // var following;
            // dbo.collection('Follow').find({follower:res.session.username},{projection:{_id:0, follower:0}}).toArray(function(err,result2){

            // })
            for(var i = 0; i < result.length; ++i)
            {
                result[i].img_path = result[i].img_path.replace(/\\/g,"/");
                result[i].img_path = result[i].img_path.replace("newViews/","");
            }
            result = result.reverse()
            res.render('feed',{data:result});
        })

    }
    else 
    {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href='+'/'+'>Login</a>');
    }
});

app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
    }
    //   res.send(file)
      var myobj = {username:req.session.username, img_path:file.path}
      dbo.collection('Images').insert(myobj ,function(err, res){
        if(err) throw err;
        console.log('image path iserted successfully');
        
      });
      res.redirect('/profile')
  });
  


router.get('/profile',(req, res)=>{
    if(req.session.username) 
    {
        console.log(req.session.username);
        var followers,followings;
        var username = req.session.username
        dbo.collection('Follow').find({follower:username}).toArray(function(err,following){
            if(err) throw err;
            followings = following.length;
        })
        
        dbo.collection('Follow').find({following:username}).toArray(function(err,follower){
            if(err) throw err;
            followers = follower.length;
        })

        dbo.collection('Images').find({username:username},{projection:{_id:0,img_path:1}}).toArray(function(err, result){
            if(err) throw err;
            var likes, comments
            for(var i = 0; i < result.length; ++i)
            {
                result[i].img_path = result[i].img_path.replace(/\\/g,"/");
                result[i].img_path = result[i].img_path.replace("newViews/","");
                
            }
            result = result.reverse();
            res.render('profile',{data:{username:req.session.username, paths:result, followers:followers, followings:followings, likes:likes, comments: comments}})
        })
        
    }
    else {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href='+'/'+'>Login</a>');
    }
    // res.render('profile')
})

router.get('/edit-profile',(req, res)=>{
    if(req.session.username) 
    {
        res.render('edit-profile')
    }
    else {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href='+'/'+'>Login</a>');
    }
    // res.render('edit-profile')
})
// var img_path;
router.get('/image-detail',(req, res)=>{
    res.render('image-detail');
})
router.post('/image-detail', (req, res)=>{
    if(req.session.username) 
    {
        console.log('in the image detail route');
         img_path = req.body.img_path;
        console.log(img_path);
        res.render('image-detail', {data:{img_path: img_path}});
    }
    else {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href='+'/'+'>Login</a>');
    }
})

router.get('/explore', (req, res)=>{
    if(req.session.username) 
    {   dbo.collection('User').find({username:{$ne:req.session.username}}, {projection:{_id:0,password:0, email:0 }}).toArray(function(err, result){
            
            
            console.log(result)
            res.render('explore', {data:result})    
        })
        
    }
    else {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href='+'/'+'>Login</a>');
    }
})

router.get('/logout',(req,res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/');
    });

});

router.post('/like',(req, res)=>{

    if(req.session.username) 
    {   
        
        var insert = {likedBy:req.session.username, likedOn: req.body.username, img_path: req.body.img_path};
        console.log(insert)
        dbinsert('Likes',insert);
        dbo.collection('Likes').find({img_path:req.body.img_path},{projection:{_id:0}}).toArray(function(err,result){
            // var likes = dbfind('Likes', {}, {_id:0});
            console.log(result.length);
            var no_of_likes = result.length;
            res.json({likes: result.length})
        });    
        
    }
    else 
    {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href='+'/'+'>Login</a>');
    
    }
});

router.post('/follow',(req, res)=>{
    var myobj = {follower:req.session.username, following: req.body.username};
    
    dbinsert('Follow', myobj);
    console.log(`${req.session.username} started following ${req.body.username}`);
});

router.post('/addComment', (req, res)=>{
    if(req.session.username) 
    {   
        
        var insert = {commentBy:req.session.username, commentOn: req.body.username, img_path: req.body.img_path, comment: req.body.comment};
        dbinsert('Comments',insert);
        dbo.collection('Comments').find({img_path:req.body.img_path},{projection:{_id:0,commentOn:0}}).toArray(function(err,result){
            
            console.log(result)
            res.json(result);

        });    
        
    }
    else 
    {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href='+'/'+'>Login</a>');
    
    }
});

router.post('/comments', (req, res)=>{
    if(req.session.username) 
    {           
        dbo.collection('Comments').find({img_path:req.body.img_path},{projection:{_id:0,commentOn:0}}).toArray(function(err,result){
           
            console.log(result)
            res.json(result);
            
        });    
        
    }
    else 
    {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href='+'/'+'>Login</a>');
    
    }
});


// var data2;
router.post('/stalk', (req, res)=>{
    if(req.session.username) 
    {   
        // console.log(req.session.username);
        var username = req.body.username
        var followers,followings;
        dbo.collection('Follow').find({follower:username}).toArray(function(err,following){
            if(err) throw err;
            followings = following.length;
        })
        
        dbo.collection('Follow').find({following:username}).toArray(function(err,follower){
            if(err) throw err;
            followers = follower.length;
        })

        dbo.collection('Images').find({username:username},{projection:{_id:0,img_path:1}}).toArray(function(err, result){
            if(err) throw err;

            for(var i = 0; i < result.length; ++i)
            {
                result[i].img_path = result[i].img_path.replace(/\\/g,"/");
                result[i].img_path = result[i].img_path.replace("newViews/","");
            }

            res.render('profile',{data:{username:req.body.username, paths:result, followers:followers, followings:followings}})
            
        })
        
        console.log('Leaving the stalk route')
    }
    else 
    {
        res.write('<h1>Please login first.</h1>');
        res.end('<a href='+'/'+'>Login</a>');
    
    }
});

app.listen(process.env.PORT || 3000,() => {
    console.log(`App Started on PORT ${process.env.PORT || 3000}`);
});