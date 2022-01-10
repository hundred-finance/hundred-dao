import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import "@nomiclabs/hardhat-vyper";
import 'hardhat-deploy';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'dotenv/config';
import {HardhatUserConfig} from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.5.0",
  vyper: {
    version: "0.2.12",
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://rpc.ftm.tools/`
        //blockNumber: parseInt(<string>process.env.ETH_MAINNET_BLOCK_NUMBER),
      },
      accounts: [{privateKey: process.env.DEV_PRIVATE_KEY!, balance: "1000000000000000000"}]
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_KOVAN_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ARBITRUM_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
    fantom: {
      url: `https://rpc.ftm.tools/`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
    harmony: {
      url: `https://harmony-0-rpc.gateway.pokt.network`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
    moonriver: {
      url: `https://rpc.moonriver.moonbeam.network`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter: {
    currency: 'EUR',
    coinmarketcap: process.env.CMC_API_KEY || undefined,
    enabled: !!process.env.REPORT_GAS,
    showTimeSpent: true,
  },
  mocha: {
    timeout: 200000
  }
};

export default config;
