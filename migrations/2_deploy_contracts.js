var MiniMeTokenFactory = artifacts.require("./MiniMeTokenFactory.sol");
var FranklinToken = artifacts.require("./FranklinToken.sol");
var FranklinController = artifacts.require('./FranklinController.sol');
var MultiSig = artifacts.require('./MultiSigWallet.sol');

const Andy = 0x0778358B4b865cA2c037b27e4584E4178157d6eD;
const Kyle = 0x43787119e4018c3f4597625Ea43fce04928C8fF0;
const Tom = 0x1D32F2aCB832AFc3D8c8ffB3BE20e8dC7Faac507;

module.exports = function(deployer) {
  deployer.deploy(MiniMeTokenFactory)
    .then(() => {
      return MiniMeTokenFactory.deployed()
        .then(f => {
          return FranklinToken.new(f.address)
        })
        .then(t => {
          token = t
          console.log('FRN:', token.address)
          return FranklinController.new(token.address)
        })
        .then(c => {
          controller = c;
          console.log('Controller:', c.address)
          token.changeController(c.address).then((res) => {
            console.log('Changed controller!', res.tx);
          });
          return MultiSig.new([Andy, Kyle, Tom], 2);
        })
        .then(ms => {
          console.log('Multisig:', ms.address);
        })
    })
};
