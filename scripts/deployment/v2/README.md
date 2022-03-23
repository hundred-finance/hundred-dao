# Deployment steps

The following steps are to be performed from the project root folder

1. Add new network definition in [hardhat.config.js](hardhat.config.js)
2. Create the new network folder under [./scripts/deployment](scripts/deployment/v2) by copying one of the existing ones
3. Modify deploy script to add `HND` and `ADMIN` addresses as well as define gauges to create by adding their lp token addresses
4. run the deploy script as the following: `npx hardhat run scripts/deployment/v2/deploy.ts --network <network>`
5. One deployment done verify that a `deployment.json` file was created under the new network folder, this file contains all contract addresses that have been deployed
6. call `set_minter` on treasury from admin wallet
7. call `add_type` on the controller to define a new gauge type if not already done
8. For each gauge call `add_gauge` on the controller to activate the gauge.
9. If using LayerZero endpoint for mirroring
   1. call `set_mirror_whitelist` on `MirroredVotingEscrow` to whitelist `MirrorGate` contract
   2. register other chains mirror gates on deployed `MirrorGate` using their layerZeroChainId, calling `setMirrorGate`
10. Manually verify the smart contract on the network explorer