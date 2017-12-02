const MiniMeTokenFactory = artifacts.require('./MiniMeTokenFactory');
const FranklinController = artifacts.require('./FranklinController');
const FranklinToken = artifacts.require('./FranklinToken');
const MultiSigWallet = artifacts.require('./MultiSigWallet.sol');

const timetravel = s => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [s],
        id: new Date().getTime(),
      },
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

contract('FranklinController', function(accounts) {
  let factory;
  let token;
  let sale;

  beforeEach(async () => {
    factory = await MiniMeTokenFactory.new();
    token = await FranklinToken.new(factory.address);
    control = await FranklinController.new(token.address);
  });

  it('should return correct balances after generation', async function() {
    await token.changeController(control.address);
    await control.generateTokens(1000000, {from: accounts[0], gas: 3000000});
    const totalSupply = await token.totalSupply();
    const balance = await token.balanceOf(accounts[0])
    assert.equal(totalSupply.toNumber(), 1000000);
    assert.equal(balance.toNumber(), 1000000)
  });

  // Produces invalid opcode, which seems right, but another test would be better.

  // it('should not create balances for other accounts', async function() {
  //   await token.changeController(control.address);
  //   await control.generateTokens(1000000, {from: accounts[1], gas: 3000000});
  //   const balance = await token.balanceOf(accounts[1]);
  //   assert.equal(balance.toNumber(), 0);
  // });

});

contract('FranklinToken', function(accounts) {
  let factory;
  let token;
  let sale;

  beforeEach(async () => {
    factory = await MiniMeTokenFactory.new();
    token = await FranklinToken.new(factory.address);
    control = await FranklinController.new(token.address);
  });

  it('should transfer tokens', async function() {
    await token.changeController(control.address);
    await control.generateTokens(1000000, {from: accounts[0], gas: 3000000});
    await token.transfer(accounts[1], 10, {from: accounts[0], gas: 3000000});
    await token.transfer(accounts[2], 4, {from: accounts[1], gas: 3000000});
    const totalSupply = await token.totalSupply();
    const balance0 = await token.balanceOf(accounts[0]);
    const balance1 = await token.balanceOf(accounts[1]);
    const balance2 = await token.balanceOf(accounts[2]);
    assert.equal(balance0.toNumber(), 999990)
    assert.equal(balance1.toNumber(), 6);
    assert.equal(balance2.toNumber(), 4);
    assert.equal(totalSupply.toNumber(), 1000000)
  });

  it('should not transfer tokens when higher than balance', async function() {
    await token.changeController(control.address);
    await control.generateTokens(1000000, {from: accounts[0], gas: 3000000});
    await token.transfer(accounts[1], 10, {from: accounts[0], gas: 3000000});
    await token.transfer(accounts[2], 11, {from: accounts[1], gas: 3000000});
    const totalSupply = await token.totalSupply();
    const balance0 = await token.balanceOf(accounts[0]);
    const balance1 = await token.balanceOf(accounts[1]);
    const balance2 = await token.balanceOf(accounts[2]);
    assert.equal(balance0.toNumber(), 999990)
    assert.equal(balance1.toNumber(), 10);
    assert.equal(balance2.toNumber(), 0);
    assert.equal(totalSupply.toNumber(), 1000000)
  });

  it('owner should approve accounts[1] to spend on its behalf', async function() {
    await token.changeController(control.address);
    await control.generateTokens(1000000, {from: accounts[0], gas: 3000000});
    await token.approve(accounts[1], 100, {from: accounts[0], gas: 3000000});
    await token.transferFrom(accounts[0], accounts[2], 90, {from: accounts[1], gas: 3000000});
    const totalSupply = await token.totalSupply();
    const balance0 = await token.balanceOf(accounts[0]);
    const balance2 = await token.balanceOf(accounts[2]);
    assert.equal(balance0.toNumber(), 999910);
    assert.equal(balance2.toNumber(), 90);
    assert.equal(totalSupply.toNumber(), 1000000);
  });

  it('accounts[1] should not be able to spend more than approved', async function() {
    await token.changeController(control.address);
    await control.generateTokens(1000000, {from: accounts[0], gas: 3000000});
    await token.approve(accounts[1], 100, {from: accounts[0], gas: 3000000});
    await token.transferFrom(accounts[0], accounts[2], 900, {from: accounts[1], gas: 3000000});
    const totalSupply = await token.totalSupply();
    const balance0 = await token.balanceOf(accounts[0]);
    const balance2 = await token.balanceOf(accounts[2]);
    assert.equal(balance0.toNumber(), 1000000);
    assert.equal(balance2.toNumber(), 0);
    assert.equal(totalSupply.toNumber(), 1000000);
  });
})

contract('MultiSigWallet', function(accounts) {
    let factory;
    let token;
    let wallet
    let sale;

    const Andy = '0xb4758797573d19a82414a8881438e067765260d8';
    const Kyle = '0xb84cbbf2dbcf95de8c2bf93bfe0d5ba3f8201598';
    const Tom = '0xcc62a3157c980d94cd5ddd58199f3f0d738c1fa4';
  
    beforeEach(async () => {
      factory = await MiniMeTokenFactory.new();
      wallet = await MultiSigWallet.new([Andy, Kyle, Tom], 2);
      token = await FranklinToken.new(factory.address);
      control = await FranklinController.new(token.address);
    });

    it('should transfer control to MultiSig', async function() {
      await token.changeController(control.address);
      await control.changeOwner(wallet.address, {from: accounts[0], gas: 3000000});
      const expected = await control.owner();
      assert.equal(expected, wallet.address);
    });

    // it('should make sure the MultiSig can hold tokens', async function() {
    //   await token.changeController(control.address);
    //   await control.generateTokens(1000000, {from: accounts[0], gas: 3000000});
    //   await token.transfer(wallet.address, 10, {from: accounts[0], gas: 3000000});
    //   const balance = await token.balanceOf(wallet.address);
    //   assert.equal(balance.toNumber(), 10);
    // })
})

//  Neat test for if we add a sale contract later down the line.

//   it('should work when trying to send ether during the sale', async function() {
    
//     const { timestamp } = web3.eth.getBlock('latest');
//     const travelTime = startTime - timestamp + 60; // 60 seconds after the start of the sale
//     await timetravel(travelTime);
//     web3.eth.sendTransaction({
//       from: accounts[0],
//       to: sale.address,
//       value: web3.toWei(1, 'ether'),
//     });
//     const totalSupply = await token.totalSupply();
//     assert.equal(totalSupply.toNumber(), 1200);
//     const totalCollected = await sale.totalCollected;
//     assert.equal(totalCollected.toNumber(), 1200);
//     const balance0 = await token.balanceOf(accounts[0]);
//     assert.equal(balance0.toNumber(), 1200);
//   });
// });