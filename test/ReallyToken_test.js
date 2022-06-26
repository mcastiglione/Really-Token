const { constants } = require('@openzeppelin/test-helpers');
const { ethers } = require('hardhat');
const chai = require('chai');
chai.use(waffle.solidity);
const { expect, assert } = chai;
const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { MAX_UINT256 } = constants;
const { EIP712Domain, Permit, domainSeparator } = require('./helpers/eip712');

describe('ReallyToken', function () {

  const name = 'Really Token';
  const symbol = 'RLY';
  const version = '1';

  const wallet = Wallet.generate();
  const owner = wallet.getAddressString();

  const value = 100;
  const nonce = 0;
  const deadline = MAX_UINT256.toString();

  beforeEach(async function () {
    ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
    [account, account2, account3, account4] = await ethers.getSigners();
    await deployments.fixture(['reallytoken']);
    token = await ethers.getContract('ReallyToken');
    await token.mint(account.address, 1000000);
    chainId = await token.getChainId();

    spender = account2.address;

    buildData = (chainId, verifyingContract, owner) => ({
      primaryType: 'Permit',
      types: { EIP712Domain, Permit },
      domain: { name, version, chainId, verifyingContract },
      message: { owner, spender, value, nonce, deadline },
    });
  });

  

  it('domain separator', async function () {
    const domain_separator_sol = await token.DOMAIN_SEPARATOR();
    const domain_separator_js = await domainSeparator(name, version, chainId.toString(), token.address);

    expect(domain_separator_sol).to.be.equal(domain_separator_js);
  });

  describe('permit', function () {
    
    it('accepts owner signature', async function () {
      const data = buildData(chainId.toString(), token.address, owner);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await token.permit(owner, spender, value, deadline, v, r, s);

      expect(await token.nonces(owner)).to.be.equal('1');
      expect(await token.allowance(owner, spender)).to.be.equal(value);
    });

    it('rejects reused signature', async function () {
      const data = buildData(chainId.toString(), token.address, owner);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await token.permit(owner, spender, value, deadline, v, r, s);
      const tx = token.permit(owner, spender, value, deadline, v, r, s);

      await expect(tx).to.be.revertedWith('ERC20Permit: invalid signature');
    });

    it('rejects expired signature', async function () {
      const data = buildData(chainId.toString(), token.address, owner);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await token.permit(owner, spender, value, deadline, v, r, s);
      const tx = token.permit(owner, spender, value, 0, v, r, s);

      await expect(tx).to.be.revertedWith('ERC20Permit: expired deadline');
    });

  });

  describe('executePermit', function () {

    it('caller must be spender', async function () {
      const data = buildData(chainId.toString(), token.address, owner);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      const tx = token.executePermit(owner, spender, spender, value, deadline, v, r, s);
      await expect(tx).to.be.revertedWith('Invalid sender');
      
    });

    it("can't execute twice", async function () {

      await token.mint(owner, 100);

      const data = buildData(chainId.toString(), token.address, owner);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await token.connect(account2).executePermit(owner, spender, spender, value, deadline, v, r, s);

      const tx = token.connect(account2).executePermit(owner, spender, spender, value, deadline, v, r, s);
      
      await expect(tx).to.be.revertedWith('ERC20Permit: invalid signature');

    });

    it("Check values", async function () {

      await token.mint(owner, 100);

      const data = buildData(chainId.toString(), token.address, owner);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await token.connect(account2).executePermit(owner, spender, account3.address, value, deadline, v, r, s);

      expect(await token.nonces(owner)).to.be.equal('1');
      expect(await token.allowance(owner, spender)).to.be.equal(0);
      expect(await token.balanceOf(account3.address)).to.be.equal(value);

    });

  });

  describe('executePermitBatch', function () {

    it("Only 1 address. Check values", async function () {

      await token.mint(owner, 100);

      const data = buildData(chainId.toString(), token.address, owner);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await token.connect(account2).executePermitBatch(
        [owner], [value], [deadline], spender, spender, [v], [r], [s]
      );

      expect(await token.nonces(owner)).to.be.equal('1');
      expect(await token.allowance(owner, spender)).to.be.equal(0);
      expect(await token.balanceOf(account2.address)).to.be.equal(value);

    });

  });

});
