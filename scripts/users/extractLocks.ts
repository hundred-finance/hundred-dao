import { ethers } from 'hardhat';
import {
    VotingEscrow,
} from "../../typechain";

import * as VotingEscrowArtifact from "../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";

import * as fs from "fs";
import {Contract} from "ethers";

const BlockLimits = [
    {chain: "harmony", start: 21326637, end: 21572414, step: 1000},
    {chain: "fantom", start: 24455139 , end: 27592101, step: 100000},
    {chain: "arbitrum", start: 1144435, end: 4545990, step: 100000},
]

extractLocks("harmony")
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

export async function extractLocks(deployName: string) {

    const [deployer] = await ethers.getSigners();
    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/${deployName}/deployments.json`).toString());

    if (deployments.VotingEscrow) {
        let votingEscrow: VotingEscrow =
            <VotingEscrow>new Contract(deployments.VotingEscrow, patchAbiGasFields(VotingEscrowArtifact.abi), deployer);

        let filter = votingEscrow.filters.Deposit(null, null, null, null, null)


        let locks: any = []
        const blockLimits = BlockLimits.find(b => b.chain === deployName);
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

        fs.writeFileSync(`./scripts/users/snapshots/${deployName}-locks.json`, JSON.stringify(locks, null, 4));
    }
}

function patchAbiGasFields(abi: any[]) {
    for(let i = 0; i < abi.length; i++) {
        abi[i].gas = undefined
    }
    return abi
}

export interface Deployment {
    Gauges: Array<{id: string, address: string}>
    VotingEscrow?: string
    GaugeController?: string
    Treasury?: string
    RewardPolicyMaker?: string
    SmartWalletChecker?: string
    Minter?: string
}