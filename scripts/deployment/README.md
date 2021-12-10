# Deployment steps

The following steps are to be performed from the project root folder

1. Add new network definition in [hardhat.config.js](hardhat.config.js)
2. Create the new netork folder under [./scripts/deployment](scripts/deployment) by copying one of the existing ones
3. Modify `deploy.ts` script to add `HND` address and define gauges to create by adding their lp token addresses
4. run the deploy script as the following: `npx hardhat run scripts/deployment/<network>/deploy.ts --network <network>`
5. One deplyment done verify that a `deployment.json` file was created under the new network folder, this file contains all contract addresses that have been deployed
6. If needed, transfer owenership to a multisig wallet by running `npx hardhat run scripts/deployment/<network>/transfer_ownership.ts --network <network>` (after modifying the script by filling the new owener address)
7. For each gauge you have to call `accept_transfer_ownership` from the new owner wallet, this will conclude ownership transfer
8. Manually verify the smart contract on the network explorer