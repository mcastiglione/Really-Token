const mainParams = {
  minBToken0Ratio: one(),
  minPoolMarginRatio: one(),
  initialMarginRatio: one(1, 1),
  maintenanceMarginRatio: one(5, 2),
  minLiquidationReward: one(10),
  maxLiquidationReward: one(1000),
  liquidationCutRatio: one(5, 1),
  protocolFeeCollectRatio: one(2, 1),
};

const defaultProtocolParameters = {
  mainParams,
  oracleDelay: 6000,
};

/**
 * @dev the bopLevels are the level definition for the bops
 */
const networkConfig = {
  1337: {
    name: 'localhost',
    USDT: '0x2ca48b8c2d574b282fdab69545646983a94a3286',
    WMATIC: '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
    defaultProtocolParameters,
  },
  31337: {
    name: 'hardhat',
    USDT: '0x2ca48b8c2d574b282fdab69545646983a94a3286',
    WMATIC: '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
    defaultProtocolParameters,
  },
  80001: {
    name: 'mumbai',
    USDT: '0x2ca48b8c2d574b282fdab69545646983a94a3286',
    WMATIC: '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
    defaultProtocolParameters,
  },
  137: {
    name: 'polygon',
    linkToken: '0xb0897686c545045afc77cf20ec7a532e3120e0f1',
    initialSupply: web3.utils.toWei('10000000'),
  },
};

function one(value = 1, left = 0, right = 18) {
  let from = ethers.BigNumber.from('1' + '0'.repeat(left));
  let to = ethers.BigNumber.from('1' + '0'.repeat(right));
  return ethers.BigNumber.from(value).mul(to).div(from);
}

console.log(one(5, 2))

module.exports = {
  networkConfig,
};
