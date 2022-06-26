const { ethers } = require('hardhat');
const chai = require('chai');
chai.use(waffle.solidity);
const { expect, assert } = chai;
const { getEventArgs } = require('./helpers/events');

describe('FeeCollector', function () {

  parseEther = (value) => {
    return ethers.utils.parseEther(value);
  }

  let rc;
  beforeEach(async function () {
    ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

    [account, account2] = await ethers.getSigners();
    await deployments.fixture(['reallytoken', 'fee_collector']);

    feeCollector = await ethers.getContract('FeeCollector');
    reallyToken = await ethers.getContract('ReallyToken');

    await reallyToken.mint(account2.address, ethers.utils.parseEther('1'));
  });

  it('should deploy FeeCollector', async () => {
    assert.ok(feeCollector.address);
  });

  it('Owner should be signer', async () => {
    const contractOwner = await feeCollector.owner();

    expect(contractOwner).to.be.equal(account.address);
  });

  it('Try to withdraw not owner', async () => {
    const tx = feeCollector.connect(account2).withdraw(reallyToken.address, account.address, 1);

    await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Try to withdraw with invalid values', async () => {
    const tx1 = feeCollector.withdraw(ADDRESS_ZERO, account.address, 1);

    await expect(tx1).to.be.revertedWith('Invalid tokenAddress');

    const tx2 = feeCollector.withdraw(reallyToken.address, ADDRESS_ZERO, 1);

    await expect(tx2).to.be.revertedWith("Invalid recipient");

    const tx3 = feeCollector.withdraw(reallyToken.address, account.address, 0);

    await expect(tx3).to.be.revertedWith("Invalid amount");

  });

  it('Not enough balance', async () => {
    const tx1 = feeCollector.withdraw(reallyToken.address, account.address, 1);

    await expect(tx1).to.be.revertedWith('Not enough balance');

  });

});
