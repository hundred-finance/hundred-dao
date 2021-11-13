# curve-dao-contracts/scripts/deployment

Deployment scripts for the Curve DAO.

## Dependencies

* [Brownie](https://github.com/eth-brownie/brownie)
* [Ganache](https://github.com/trufflesuite/ganache-cli)

## Process Overview

### 1. Initial Setup

[`deployment_config.py`](deployment_config.py) holds configurable / sensitive values related to the deployment. Before starting, you must set the following variables:

* Modify the `get_live_admin` function to return the primary admin [`Account`](https://eth-brownie.readthedocs.io/en/stable/api-network.html#brownie.network.account.Account) object and four funding admin accounts. See the Brownie [account management](https://eth-brownie.readthedocs.io/en/stable/account-management.html) documentation for information on how to unlock local accounts.
* Set vesting information in `STANDARD_ESCROWS` and `FACTORY_ESCROWS`. The structure  of each variable is outlined in the comments.
* Confirm that `LP_VESTING_JSON` points to the JSON which defines the [percentages each historic LP will receive](https://github.com/curvefi/early-user-distribution/blob/master/output-with-bpt.json).

### 2. Deploying the Curve DAO

1. If you haven't already, install [Brownie](https://github.com/eth-brownie/brownie):

    ```bash
    pip install eth-brownie
    ```

2. Verify [`deploy_dao`](deploy_dao.py) by testing in on a forked mainnet:

    ```bash
    brownie run deploy_dao development --network mainnet-fork
    ```

3. Run the first stage of the [`deploy_dao`](deploy_dao.py) script:

    Live deployment this is split into two calls. The first action deploys only `ERC20CRV` and `VotingEscrow`:

    ```bash
    brownie run deploy_dao live_part_one --network mainnet
    ```

    With these contracts deployed, the Aragon DAO setup can begin while the rest of Curve DAO is deployed.

4. Run the second stage of [`deploy_dao`](deploy_dao.py):

    ```bash
    brownie run deploy_dao live_part_two --network mainnet
    ```

    This deploys and links all of the core Curve DAO contracts. A JSON is generated containing the address of each deployed contract. **DO NOT MOVE OR DELETE THIS FILE**. It is required in later deployment stages.

### 4. Transferring Ownership of Curve DAO to Aragon

1. Verify [`transfer_dao_ownership`](transfer_dao_ownership) by testing it on a forked mainnet:

    ```
    brownie run transfer_dao_ownership development --network mainnet-fork
    ```

2. Run the [`transfer_dao_ownership`](transfer_dao_ownership) script:

    If you haven't yet, modify [`deployment_config`](deployment_config.py) so that `ARAGON_AGENT` points to the [Aragon Ownership Agent](https://github.com/aragon/aragon-apps/blob/master/apps/agent/contracts/Agent.sol) deployment address. Then:

    ```bash
    brownie run transfer_dao_ownership live --network mainnet
    ```

    This transfers the ownership of [`GaugeController`](../../contracts/GaugeController.vy), [`VotingEscrow`](../../contracts/VotingEscrow.vy) and [`ERC20CRV`](../../contracts/ERC20CRV.vy) from the main admin account to the [Aragon Ownership Agent](https://github.com/aragon/aragon-apps/blob/master/apps/agent/contracts/Agent.sol).
    
Subgraph setup for UI

Deploy [connect-thegraph-voting](https://github.com/curvefi/connect-thegraph-voting)

Deploy [votingescrow-subgraph](https://github.com/curvefi/votingescrow-subgraph)
