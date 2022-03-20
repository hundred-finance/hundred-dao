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
  solidity: {
    compilers: [{version: "0.5.0"}, {version: "0.8.0"}]
  },
  vyper: {
    version: "0.2.15",
  },
  networks: {
    hardhat: {
      initialDate: "2021-11-20T00:00:00",
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
        blockNumber: parseInt(<string>process.env.ETH_MAINNET_BLOCK_NUMBER),
      }
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_KOVAN_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
    optimism_kovan: {
      url: `https://kovan.optimism.io`,
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
    optimism: {
      url: `https://mainnet.optimism.io`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
    gnosis: {
      url: `https://rpc.gnosischain.com`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
    avalanche_fuji: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
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
