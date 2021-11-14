# hundred-dao/scripts/deployment

Deployment scripts for the Hundred DAO.

## Dependencies

* [Brownie](https://github.com/eth-brownie/brownie)
* [Ganache](https://github.com/trufflesuite/ganache-cli)

## Process Overview

### 1. Initial Setup

[`deployment_config.py`](deployment_config.py) holds configurable / sensitive values related to the deployment. Before starting, you must set the following variables:

* Modify the `[network_name]_config()` function to return the necessary parameters for deploying in that network

### 2. Deploying the Hundred DAO

1. If you haven't already, install [Brownie](https://github.com/eth-brownie/brownie):

    ```bash
    pip install eth-brownie
    ```

2. Verify [`deploy_eth_mainnet`](deploy_eth_mainnet.py) by testing in on a forked mainnet:

    ```bash
    brownie run deploy_eth_mainnet --network mainnet-fork
    ```

3. Run in mainnet [`deploy_eth_mainnet`](deploy_eth_mainnet.py) script:

    ```bash
    brownie run deploy_eth_mainnet --network mainnet
    ```

    This deploys and links all of the core Hundred DAO contracts. A JSON is generated containing the address of each deployed contract. **DO NOT MOVE OR DELETE THIS FILE**. It is required in later deployment stages.