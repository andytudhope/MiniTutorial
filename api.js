var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var jwt    = require('jsonwebtoken');
var config = require('./config'); 

// Set up contracts and web3 for Ethereum stuff
// =============================================================
var Web3 = require('web3');
var contract = require('truffle-contract');

const MiniMeTokenFactory = require('./build/contracts/MiniMeTokenFactory.json');
const FranklinController = require('./build/contracts/FranklinController.json');
const FranklinToken = require('./build/contracts/FranklinToken.json');
const MultiSigWallet = require('./build/contracts/MultiSigWallet.json');

let factory = contract(MiniMeTokenFactory);
let control = contract(FranklinController);
let token = contract(FranklinToken);
let multisig = contract(MultiSigWallet);

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

[factory, control, token, multisig].forEach(function(contract) {
    contract.setProvider(web3.currentProvider);
});

let account;
let accountHot;

web3.eth.getAccounts((err, accs) => {
    account = accs[0];
    accountHot = accs[1];
})


// Setup for express api 
// =======================================================
var port = process.env.PORT || 8080;        // set our port

app.set('superSecret', config.secret); // secret variable

app.use(bodyParser.json());

var router = express.Router();              // get an instance of the express Router

// Middleware JWT Protection
// ==========================================================
// route middleware to verify a token
// router.use(function(req, res, next) {
    
//       // check post parameters for token
//       var token = req.headers['x-access-token'];
    
//       // decode token
//       if (token) {
    
//         // verifies secret and checks exp
//         jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
//           if (err) {
//             return res.json({ success: false, message: 'Failed to authenticate token.' });    
//           } else {
//             // if everything is good, save to request for use in other routes
//             req.decoded = decoded;    
//             next();
//           }
//         });
    
//       } else {
    
//         // if there is no token
//         // return an error
//         return res.status(403).send({ 
//             success: false, 
//             message: 'No token provided.' 
//         });
    
//       }
//     });

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

router.route('/generateTokens')
    .post(function(req,res) {
        var amount = req.body.amount;

        let generated;
        let toMultiSig;
        let toHotWallet;

        // Need to make sure that accounts[0] is the account that deployed the contracts/is the owner
        var instance = control.at('0x2eedcaef7e164dcb8e3746be75efd6642f38b2ad');
        
            instance.generateTokens(amount, {from: account, gas: 3000000}).then((tx) => {
                for (var i = 0; i < tx.logs.length; i++) {
                    var log = tx.logs[i];
                    console.log(log);
                    if (log.event == "TokensMinted") {
                        generated = log.args._amount.toNumber();
                    }
                }
            }).catch(function(err) {
                // There was an error! Handle it.
                console.log({"Error": err});
            });
            
        // Some to accounts[1] - our 'hot wallet' and the rest to the multisig
        // Multisig transfer first, timeout required to return correct json
        
        var instance = token.at('0xf7db6e74965fa9a07a408e2d67f21fc3e0abb205');
        
        instance.transfer('0xe0d8a90164302f07e40334cbc4c1e143b124e14e', amount*95/100, {from: account, gas: 3000000}).then((tx) => {
            for (var i = 0; i < tx.logs.length; i++) {
                var log = tx.logs[i];
                if (log.event == "Transfer") {
                    res.json({"ToMultiSig": log.args._amount.toNumber()});
                }
            }
        }).catch(function(err) {
            // There was an error! Handle it.
            console.log({"Error": err});
        });
        
    });

router.route('/transfer')
    .post(function(req,res) {
        var toAddress = req.body.toAddress.toString();
        var amount = req.body.amount;

        var instance = token.at('0xf7db6e74965fa9a07a408e2d67f21fc3e0abb205');
        instance.transfer(toAddress, amount, {from: account, gas: 3000000})
            .then((tx) => {
                for (var i = 0; i < tx.logs.length; i++) {
                    var log = tx.logs[i];

                    if (log.event == "Transfer") {
                        res.json({"To": log.args._to, "Amount": log.args._amount.toNumber()});
                    break;
                    }
                }
            }).catch(function(err) {
                // There was an error! Handle it.
                res.json({"Error": err});
            });
    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);





// setTimeout(function() {
//     instance.transfer(accountHot, amount*5/100, {from: account, gas: 3000000}).then((tx) => {
//         for (var i = 0; i < tx.logs.length; i++) {
//             var log = tx.logs[i];
//             if (log.event == "Transfer") {
//                 toHotWallet = log.args._amount.toNumber();
//                 res.json({"Generated": generated, "ToMultiSig": toMultiSig, "ToHotWallet": toHotWallet})
//             }
//         }
//     }).catch(function(err) {
//         // There was an error! Handle it.
//         console.log({"Error": err});
//     });
// }, 1000)