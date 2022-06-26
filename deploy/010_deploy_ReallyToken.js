const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const tokenName = 'Really Token';
  const tokenSymbol = 'RLY';

  await deploy('ReallyToken', {
    from: deployer,
    log: true,
    args: [],
    proxy: {
      proxyContract: 'UUPSProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [
            tokenName,
            tokenSymbol
          ],
        },
      },
    }
  });

};

module.exports.tags = ['reallytoken'];
