require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('solidity-coverage');
require('hardhat-gas-reporter');
require('hardhat-deploy');
require('@nomiclabs/hardhat-etherscan');

require('dotenv').config();

const MNEMONIC = process.env.MNEMONIC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL;
const INFURA_API_KEY = process.env.INFURA_API_KEY;

module.exports = {
  networks: {
    hardhat: {
      tags: ['local'],
      accounts: {
        privateKey: PRIVATE_KEY,
        balance: '100000000000000000000',
      },
    },
    localhost: {
      url: 'http://127.0.0.1:8545', // ganache local network
      tags: ['local'],
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_API_KEY}`,
      accounts: { mnemonic: MNEMONIC },
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
      accounts: { mnemonic: MNEMONIC },
    },
    mumbai: {
      url: MUMBAI_RPC_URL,
      accounts: [PRIVATE_KEY],
      tags: ['testnet'],
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: 0,
    other: 1,
  },
  gasReporter: {
    enabled: false,
  },
  mocha: {
    timeout: 999999,
  },
  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.5.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.4.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};
