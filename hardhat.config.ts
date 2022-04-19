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
    compilers: [{version: "0.5.0"}, {version: "0.8.0"}, {version: "0.8.1"}]
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
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    optimism_kovan: {
      url: `https://kovan.optimism.io`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ARBITRUM_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    fantom: {
      url: `https://rpc.ftm.tools/`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    harmony: {
      url: `https://harmony-0-rpc.gateway.pokt.network`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    moonriver: {
      url: `https://rpc.moonriver.moonbeam.network`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    optimism: {
      url: `https://mainnet.optimism.io`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    gnosis: {
      url: `https://rpc.gnosischain.com`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    avalanche_fuji: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    iotex: {
      url: `https://babel-api.mainnet.iotex.io`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    polygon: {
      url: `https://polygon-rpc.com`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    },
    meter: {
      url: `https://rpc.meter.io`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`, `0x${process.env.DEV_MULTICHAIN_GATE_DEPLOYER_PRIVATE_KEY}`],
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      ropsten: process.env.ETHERSCAN_API_KEY,
      rinkeby: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      kovan: process.env.ETHERSCAN_API_KEY,
      // binance smart chain
      bsc: "YOUR_BSCSCAN_API_KEY",
      bscTestnet: "YOUR_BSCSCAN_API_KEY",
      // huobi eco chain
      heco: "YOUR_HECOINFO_API_KEY",
      hecoTestnet: "YOUR_HECOINFO_API_KEY",
      // fantom mainnet
      opera: process.env.FANTOM_SCAN_API_KEY,
      ftmTestnet: process.env.FANTOM_SCAN_API_KEY,
      // optimism
      optimisticEthereum: process.env.OPTIMISM_SCAN_API_KEY,
      optimisticKovan: process.env.OPTIMISM_SCAN_API_KEY,
      // polygon
      polygon: process.env.POLYGON_SCAN_API_KEY,
      polygonMumbai: process.env.POLYGON_SCAN_API_KEY,
      // arbitrum
      arbitrumOne: process.env.ARBITRUM_SCAN_API_KEY,
      arbitrumTestnet: process.env.ARBITRUM_SCAN_API_KEY,
      // avalanche
      avalanche: process.env.AVALANCHE_SCAN_API_KEY,
      avalancheFujiTestnet: process.env.AVALANCHE_SCAN_API_KEY,
      // moonbeam
      moonbeam: "YOUR_MOONBEAM_MOONSCAN_API_KEY",
      moonriver: process.env.MOONRIVER_SCAN_API_KEY,
      moonbaseAlpha: "YOUR_MOONBEAM_MOONSCAN_API_KEY",
      // harmony
      harmony: "YOUR_HARMONY_API_KEY",
      harmonyTest: "YOUR_HARMONY_API_KEY",
      // xdai and sokol don't need an API key, but you still need
      // to specify one; any string placeholder will work
      xdai: "api-key",
      sokol: "api-key",
      aurora: "api-key",
      auroraTestnet: "api-key",
    }
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
