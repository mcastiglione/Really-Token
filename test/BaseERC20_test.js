const { ethers } = require('hardhat');
const chai = require('chai');
chai.use(waffle.solidity);
const { expect, assert } = chai;
const { getEventArgs } = require('./helpers/events');

describe('BaseERC20', function () {


  let rc;
  beforeEach(async function () {
    ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
    [account, account2, account3, account4] = await ethers.getSigners();
    await deployments.fixture(['reallytoken']);
    token = await ethers.getContract('ReallyToken');
    await token.mint(account.address, 1000000);
  });

  it('should deploy ReallyToken', async () => {
    assert.ok(token.address);
  });

  it('name, symbol, decimals and initial totalSupply', async () => {
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();

    expect(name).to.be.equal('Really Token');
    expect(symbol).to.be.equal('RLY');
    expect(decimals).to.be.equal(18);
    expect(totalSupply).to.be.equal(1000000);

  });

  it('balanceOf', async () => {
    const balance = await token.balanceOf(account.address);
    const balance2 = await token.balanceOf(account2.address);
    
    expect(balance).to.be.equal(1000000);
    expect(balance2).to.be.equal(0);
    
  });

  describe('transfer', function () {

    it('invalid address to', async () => {
      const tx = token.transfer(ADDRESS_ZERO, 1);
      await expect(tx).to.be.revertedWith('Invalid address to');
    });

    it('invalid amount', async () => {
      const tx = token.transfer(account.address, 0);
      await expect(tx).to.be.revertedWith('Invalid amount');
    });

    it('should deploy ReallyToken', async () => {
      assert.ok(token.address);
    });

    it('balance is not enough', async () => {
      const tx = token.connect(account2).transfer(account.address, 1);
      await expect(tx).to.be.revertedWith('Not enough balance!');

      const tx2 = token.transfer(account2.address, 1000001);
      await expect(tx2).to.be.revertedWith('Not enough balance!');

    });

    it('values ok', async () => {
      token.transfer(account2.address, 1);
      const balanceFrom = await token.balanceOf(account.address);
      const balanceTo = await token.balanceOf(account2.address);

      await expect(balanceFrom).to.be.equal(999999);
      await expect(balanceTo).to.be.equal(1);

    });
    
    it('balance ok', async () => {
      token.transfer(account2.address, 1);
      const balanceFrom = await token.balanceOf(account.address);
      const balanceTo = await token.balanceOf(account2.address);

      await expect(balanceFrom).to.be.equal(999999);
      await expect(balanceTo).to.be.equal(1);

    });

    it('event was emitted and values are correct', async () => {
      const tx = await token.transfer(account2.address, 1);

      await expect(tx).to.emit(token, 'Transfer');
      args = await getEventArgs(tx, 'Transfer', token);

      expect(args.from).to.be.equal(account.address);
      expect(args.to).to.be.equal(account2.address);
      expect(args.value).to.be.equal(1);
  
    });


  });

  describe('transferFrom', function () {
      
    it('Allowance is enough but balance, not', async () => {
      await token.connect(account2).approve(account3.address, 1);
      
      const tx = token.connect(account3).transferFrom(account2.address, account.address, 1);
      
      await expect(tx).to.be.revertedWith('Not enough balance!');

    });

    it('Allowance is not enough', async () => {
      const tx = token.connect(account3).transferFrom(account.address, account2.address, 1);
      
      await expect(tx).to.be.revertedWith('Not enough allowance');

    });

    it('Both are enough', async () => {
      await token.connect(account).approve(account2.address, 1);

      await token.connect(account2).transferFrom(account.address, account3.address, 1);
      
      const balanceOf = await token.balanceOf(account3.address);
      
      await expect(balanceOf).to.be.equal(1);

    });

  });

  describe('Allowance', function () {
    
    it('Not enough allowance', async () => {
      const tx = token.connect(account2).transferFrom(account.address, account3.address, 1);
      await expect(tx).to.be.revertedWith('Not enough allowance');
    });

    describe('approve', function () {
      it('invalid values', async () => {
        
        const tx = token.approve(ADDRESS_ZERO, 1);
        await expect(tx).to.be.revertedWith("Invalid address to");

        const tx3 = token.approve(account2.address, 0);
        await expect(tx3).to.be.revertedWith("Invalid amount");

      });

      it('check values and events', async () => {

        await token.approve(account2.address, 1);

        const allowance = await token.allowance(account.address, account2.address);
        
        await expect(allowance).to.be.equal(1);

      });
    });

    describe('increaseAllowance', function () {
      it('invalid values', async () => {
        
        const tx = token.increaseAllowance(ADDRESS_ZERO, 1);
        await expect(tx).to.be.revertedWith("Invalid address to");

        const tx2 = token.increaseAllowance(account2.address, 0)
        await expect(tx2).to.be.revertedWith("Invalid amount");

      });

      it('check values', async () => {

        await token.increaseAllowance(account2.address, 1);
        await token.increaseAllowance(account2.address, 2);
        await token.increaseAllowance(account2.address, 3);
        await token.increaseAllowance(account2.address, 4);
        await token.increaseAllowance(account2.address, 5);

        const allowance = await token.allowance(account.address, account2.address);
        
        await expect(allowance).to.be.equal(15);

      });
    });

    describe('decreaseAllowance', function () {
      it('invalid values', async () => {

        const tx = token.decreaseAllowance(ADDRESS_ZERO, 1);
        await expect(tx).to.be.revertedWith("Invalid address");

        const tx2 = token.decreaseAllowance(account2.address, 0)
        await expect(tx2).to.be.revertedWith("Invalid amount");

      });

      it('check values', async () => {

        await token.increaseAllowance(account2.address, 10000000);
        
        await token.decreaseAllowance(account2.address, 100000);

        const allowance = await token.allowance(account.address, account2.address);
        
        await expect(allowance).to.be.equal(9900000);

      });

      it('decrease more than available', async () => {

          await token.increaseAllowance(account2.address, 10000000);
          
          const tx = token.decreaseAllowance(account2.address, 100000000);
          
          await expect(tx).to.be.revertedWith('Invalid amount');
  
        });

    });

  });

  describe('Mint', function () {
    
    it('Caller is not owner', async () => {
      const tx = token.connect(account2).mint(account.address, 1);
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
    });
    
    it('Invalid to', async () => {
      const tx = token.mint(ADDRESS_ZERO, 1);
      await expect(tx).to.be.revertedWith('Invalid address to');
    });

    it('Invalid amount', async () => {
      const tx = token.mint(account.address, 0);
      await expect(tx).to.be.revertedWith('Invalid amount');
    });

    it('Correct values', async () => {
      const tx = await token.mint(account3.address, 1);
      const balance = await token.balanceOf(account3.address);
      await expect(balance).to.be.equal(1);
    });

  });

  describe('burn', function () {
    
    it('Balance is not enough', async () => {
      const tx = token.connect(account2).burn(1);
      await expect(tx).to.be.revertedWith('Not enough balance to burn!');
    });

    it('Invalid amount', async () => {
      const tx = token.connect(account2).burn(0);
      await expect(tx).to.be.revertedWith('Invalid amount');
    });

    it('Check values', async () => {
      await token.mint(account2.address, 1000);
      
      await token.connect(account2).burn(500);

      const balance = await token.balanceOf(account2.address);

      await expect(balance).to.be.equal(500);
    });

  });

});
