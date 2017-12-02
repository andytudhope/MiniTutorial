var FranklinToken = artifacts.require("./FranklinToken.sol");
var FranklinController = artifacts.require('./FranklinController.sol');

module.exports = function(deployer) {
  token = FranklinToken.at('0x00054ef503a95a95fa7a12d3d29d7d11c89fe4ae');
  FranklinController.new('0x00054ef503a95a95fa7a12d3d29d7d11c89fe4ae')
        .then(c => {
          controller = c;
          console.log('Controller:', c.address)
          token.changeController(c.address).then((res) => {
            console.log('Changed controller!', res.tx);
          });
        })
};