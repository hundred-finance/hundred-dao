import { ethers } from 'hardhat';
import {
    VotingEscrow,
} from "../../typechain";
import fs from "fs";
import {BigNumber, Contract} from "ethers";
import * as VotingEscrowArtifact from "../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";
import {BlockLimits} from "./blocks";
import {Deployment, getChainName, patchAbiGasFields} from "../airdrops/utils/helpers";
import {mapToObj} from "../airdrops/utils/helpers";

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
    let userLocks: Array<UserLock> = JSON.parse(fs.readFileSync(`./scripts/veTokenAllowanceVote/locks/${chainName}.json`).toString());

    let block = BlockLimits.find(b => b.chain === chainName);
    let blockNumber = block ? block.end : 0
    let l1blockNumber = block ? block.l1_end : 0

    if (deployments.VotingEscrow) {
        let balances: Map<string, string> = new Map<string, string>()

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

            veHndBalances.forEach((b: BigNumber, index: number) => {
                balances.set(userLocks[index].user, b.toString());
            });

            fs.writeFileSync(`./scripts/veTokenAllowanceVote/balances/${chainName}.json`, JSON.stringify(mapToObj(balances), null, 4));
        }
    }
}

async function getBalance(votingEscrow: VotingEscrow, user: string, blockNumber: number, l1blockNumber: number): Promise<BigNumber> {
    return await votingEscrow.balanceOfAt(user, l1blockNumber ? l1blockNumber : blockNumber)
}

interface UserLock {
    user: string,
    lock_start: string,
    lock_end: string,
    hnd_amount: string,
    block_number: string
}
