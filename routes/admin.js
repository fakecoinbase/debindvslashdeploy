const express = require('express');
const router = express.Router();
const passport = require('passport');
const admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const hasVoted = require('../models/hasVoted');
const Email = require('../models/Email');
const Aadhar = require('../models/Aadhar');
require('../config/passport')(passport); 
var Web3 = require("web3");
const HDwalletProvider = require('@truffle/hdwallet-provider');
let errors = [];


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
   
    else{
      res.redirect('/admin/login');
    }
   
  }


//Admin Login
router.get('/login', (req,res) => res.render('adminLogin'));

router.post('/login',(req, res, next) => {

    const {emailID,password} = req.body;

   passport.authenticate('admin-local',{
       successRedirect: '/admin/dashboard',
       failureRedirect: '/admin/login',
       failureMessage: 'oopss'
   })(req,res,next);
    

  });

//Variables for voter turnout data
var ucount = 0;
var vcount = 0;

  
//Admin Dashboard
router.get('/dashboard', ensureAuthenticated, (req,res) => {
  User.countDocuments()
    .then((no) => ucount = no)
      .then(() => hasVoted.countDocuments())
        .then((no) => vcount = no)
            .then(() => res.render('admin_dashboard', {ucount:ucount, vcount:vcount, errors}))
            
  
  // console.log(`ucount = ${ucount}`);
  // hasVoted.countDocuments().then((no) => console.log(`Voted count = ${no}`));
  
});

//Voted List
router.get('/votedList',ensureAuthenticated, (req,res) => {
  hasVoted.find( {}, (err, data) => {
    if (err) throw err;
    else {
        res.render('votedList',{data:data});
    }
});
});

//Aadhar Updation
router.get('/register', ensureAuthenticated, (req,res) => {
  res.render('register_aadhar');
});

router.post('/register', (req,res) => {
  errors = [];
  var { name,ano, email } = req.body;
  //console.log(`NAME: ${name}, ANO: ${ano},EMAIL: ${email}`);
  email = email.toLowerCase();
  if (!name || !email || !ano ) {
    errors.push({ msg: 'Please enter all fields' });
    res.render('register_aadhar', {
      errors,
      name,
      email,
      ano
    });
  }
  else {
  User.findOne({ email: email }).then(user => {
    if (user) {
      errors.push({ msg: 'Email already exists' });
      res.render('register_aadhar', {
        errors,
        name,
        email,
        ano
      });
    }
    else {
      Aadhar.findOne({ano: ano}).then(user => {
        if(user) {
          errors.push({ msg: 'Aadhar number already exists' });
          res.render('register_aadhar', {
            errors,
            name,
            email,
            ano
          });
        }
        else {
          new Aadhar({
            name1 : name,
            ano1 : ano,
            email1 : email
           }).save(() => {
              req.flash('success_msg', 'Successfully Added to Aadhar collection');
              console.log('Added aadhar details to Collection');
              res.redirect('/admin/dashboard');
            });
            
          }
        });
    }
  }).catch((error) => {
    console.log(error);
  });
}
});

//Contract address
router.post('/address', (req,res) => {
  var addr = req.body.address;
  var cname = req.body.cname;
  addr = addr.trim();
  errors = [];
  if (!addr || !cname) {
    errors.push({ msg: 'Please enter all fields' });
    res.redirect('/admin/dashboard');
  }
  else if( addr != contractAddress ){
    errors.push({ msg: 'Verification of contract Address failed' });
    res.redirect('/admin/dashboard');
  }
  else {
    Election.methods.addCandidate(cname)
    .send({ from: coinbase, gas:6000000, gasPrice: web3.utils.toWei('0.00000009', 'ether')}).then((reciept) => {
      console.log(reciept);
      //RENDER THE SUCESS PAGE
      req.flash('success_msg', `Successfully Added ${cname} as a Candidate`);
      res.redirect('/admin/dashboard');
    })
    // Email.deleteMany({}, () => console.log('Verification table cleared'));
    // hasVoted.deleteMany({}, () => console.log('Has Voted Table cleared'));

  }
});


//Coinbase
router.post('/coinbase', (req,res) => {
  var coin = req.body.coinbase;
  var key = req.body.privatekey;
  var ccoin = req.body.ccoinbase;
  var ckey = req.body.cprivatekey;
  errors = []
  if (!coin || !key ) {
    errors.push({ msg: 'Please enter all fields' });
    res.redirect('/admin/dashboard');
  }
  else if (ccoin != coinbase || ckey!= privateKey){
    errors.push({ msg: 'Credentials do not match'});
    res.redirect('/admin/dashboard');
  }
  else {
    req.flash('success_msg', 'Successfully Updated');
    res.redirect('/admin/dashboard');
  }
});



module.exports = router;