import { ethers } from 'hardhat';
import {
    VotingEscrow,
} from "../../typechain";
import fs from "fs";
import {BigNumber, Contract} from "ethers";
import * as VotingEscrowArtifact from "../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";
import {BlockLimits} from "./blocks-snapshot-2";
import {Deployment, getChainName, patchAbiGasFields} from "./utils/helpers";

queryUserVeHndBalances()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

async function queryUserVeHndBalances() {
    const [deployer] = await ethers.getSigners();
    const chainName = getChainName(await deployer.getChainId());

    let deployments: Deployment = JSON.parse(fs.readFileSync(`./scripts/deployment/${chainName}/deployments.json`).toString());
    let userLocks: Array<UserLock> = readUserLocks(chainName);

    let block = BlockLimits.find(b => b.chain === chainName);
    let blockNumber = block ? block.end : 0
    let l1blockNumber = block ? block.l1_end : 0

    if (deployments.VotingEscrow) {
            let votingEscrow: VotingEscrow =
                <VotingEscrow>new Contract(deployments.VotingEscrow, patchAbiGasFields(VotingEscrowArtifact.abi), deployer);

            if (block) {

                let veHndBalances =
                    await Promise.all(
                        userLocks.map(u => u.user).map(u => getBalance(
                            votingEscrow, u,
                            blockNumber ? blockNumber : 0,
                            l1blockNumber ? l1blockNumber : 0
                        ))
                    )

                let users = veHndBalances.map((b: BigNumber, index: number) => {
                    return {
                        user: userLocks[index].user,
                        balance: b.toString()
                    } ;
                });

                fs.writeFileSync(`./scripts/users/balances/${chainName}-snapshot-2.json`, JSON.stringify(users, null, 4));
            }
    }
}

async function getBalance(votingEscrow: VotingEscrow, user: string, blockNumber: number, l1blockNumber: number): Promise<BigNumber> {
    return await votingEscrow.balanceOfAt(user, l1blockNumber ? l1blockNumber : blockNumber)
}

function readUserLocks(chainName: string) {
    let userLocks: Array<UserLock> = []
    let uniqueUserLocks: Array<UserLock> = []

    let snapshot1 = `./scripts/users/snapshots/${chainName}-snapshot-1.json`
    let snapshot2 = `./scripts/users/snapshots/${chainName}-snapshot-2.json`

    if (fs.existsSync(snapshot1)) {
        userLocks = userLocks.concat(JSON.parse(fs.readFileSync(snapshot1).toString()))
    }
    if (fs.existsSync(snapshot2)) {
        userLocks = userLocks.concat(JSON.parse(fs.readFileSync(snapshot2).toString()))
    }

    for (let i = 0; i < userLocks.length; i++) {
        let lock = userLocks[i];
        let uniqueLock = uniqueUserLocks.find(l => l.user === lock.user);
        if (!uniqueLock) {
            uniqueUserLocks.push(lock);
        }
    }

    return uniqueUserLocks
}

interface UserLock {
    user: string,
    lock_start: string,
    lock_end: string,
    hnd_amount: string,
    block_number: string
}
