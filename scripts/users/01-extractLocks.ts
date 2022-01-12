import { ethers } from 'hardhat';
import {
    VotingEscrow,
} from "../../typechain";

import * as VotingEscrowArtifact from "../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";

import * as fs from "fs";
import {Contract} from "ethers";
import {BlockLimits} from "./blocks";
import {Deployment, getChainName, patchAbiGasFields} from "./utils/helpers";

extractLocks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

export async function extractLocks() {

    const [deployer] = await ethers.getSigners();
    const chainName = getChainName(await deployer.getChainId());

    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/${chainName}/deployments.json`).toString());

    if (deployments.VotingEscrow) {
        let votingEscrow: VotingEscrow =
            <VotingEscrow>new Contract(deployments.VotingEscrow, patchAbiGasFields(VotingEscrowArtifact.abi), deployer);

        let filter = votingEscrow.filters.Deposit(null, null, null, null, null)

        let locks: any = []
        const blockLimits = BlockLimits.find(b => b.chain === chainName);
        if (blockLimits) {
            let blockNumber = blockLimits.start;

            while(blockNumber < blockLimits.end) {
                let events = await votingEscrow.queryFilter(filter, blockNumber, blockNumber + blockLimits.step);
                locks = [
                    ...locks,
                    ...(events
                        .filter(e => e.args.type.toNumber() === 1)
                        .map(event => {
                            return {
                                user: event.args.provider,
                                lock_start: event.args.ts.toString(),
                                lock_end: event.args.locktime.toString(),
                                hnd_amount: event.args.value.toString(),
                                block_number: event.blockNumber.toString(),
                            }
                        }))
                ]
                blockNumber += blockLimits.step
            }
        }

        console.log(`Found ${locks.length} Locks`);

        fs.writeFileSync(`./scripts/users/snapshots/${chainName}-locks.json`, JSON.stringify(locks, null, 4));
    }
}