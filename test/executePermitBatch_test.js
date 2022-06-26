const { constants } = require('@openzeppelin/test-helpers');
const { ethers } = require('hardhat');
const chai = require('chai');
chai.use(waffle.solidity);
const { expect, assert } = chai;
const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const { MAX_UINT256 } = constants;
const { EIP712Domain, Permit } = require('./helpers/eip712');

describe('executePermitBatch', function () {

  const name = 'Really Token';
  const symbol = 'RLY';
  const version = '1';

  const wallet = Wallet.generate();
  const owner = wallet.getAddressString();

  const value = 100;
  const nonce = 0;
  const deadline = MAX_UINT256.toString();

  beforeEach(
    async function () {

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
    }
  );

  describe('executePermitBatch', function () {
    it("Only 1 address. Check values", async function () {

      await token.mint(owner, 100);

      const data = buildData(
        chainId.toString(), 
        token.address, 
        owner
      );

      const signature = ethSigUtil.signTypedMessage(
        wallet.getPrivateKey(), 
        {
           data 
        }
      );

      const {
        v,
        r,
        s
      } = fromRpcSig(signature);

      await token.connect(account2).executePermitBatch(
        [owner], [value], [deadline], spender, spender, [v], [r], [s]
      );

      expect(await token.nonces(owner)).to.be.equal('1');
      expect(await token.allowance(owner, spender)).to.be.equal(0);
      expect(await token.balanceOf(account2.address)).to.be.equal(value);

    });

  });

});
