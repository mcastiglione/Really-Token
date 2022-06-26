module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy('FeeCollector', {
    from: deployer,
    log: true,
    args: [],
    proxy: {
      proxyContract: 'UUPSProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [
              deployer
          ],
        },
      },
    }
  });

};

module.exports.tags = ['fee_collector'];
