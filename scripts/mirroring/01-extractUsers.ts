import { ethers } from 'hardhat';
import {
    VotingEscrow,
} from "../../typechain";

import * as VotingEscrowArtifact from "../../artifacts/contracts/VotingEscrow.vy/VotingEscrow.json";

import * as fs from "fs";
import {Contract} from "ethers";
import {Deployment, getChainName, patchAbiGasFields} from "../airdrops/utils/helpers";
import path from "path";

export const BlockLimits = [
    { chain: "harmony", start: 20000000, end: 23604069, step: 1000},
    { chain: "fantom", start: 24455139 , end: 32397384, step: 100000},
    { chain: "arbitrum", start: 1144435, end: 7317361, step: 100000},
    { chain: "moonriver", start: 1269701, end: 1547431, step: 1000},
    { chain: "gnosis", start: 20759486, end: 20909347, step: 1000},
]

extractUsers()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

export async function extractUsers() {

    const [deployer] = await ethers.getSigners();
    const chainId = await deployer.getChainId();
    const chainName = getChainName(chainId);
    let deployments: Deployment|undefined = undefined;
    let storePath = path.join(__dirname, `data/users-with-locks.json`)

    try {
        deployments = JSON.parse(fs.readFileSync(path.join(__dirname, `../deployment/v1/${chainName}/deployments.json`)).toString());
    } catch (e) {
        console.log(`No v1 deployment on ${chainName}`)
    }

    if (!deployments) {
        try {
            deployments = JSON.parse(fs.readFileSync(path.join(__dirname, `../deployment/v2/${chainName}/deployments.json`)).toString());
        } catch (e) {
            console.log(`No v2 deployment on ${chainName}`)
        }
    }

    let votingEscrowAddress = deployments?.VotingEscrow
    if (!votingEscrowAddress) {
        votingEscrowAddress = deployments?.VotingEscrowV1
    }
    if (!votingEscrowAddress) {
        votingEscrowAddress = deployments?.VotingEscrowV2
    }

    if (deployments && votingEscrowAddress) {

        let votingEscrow: VotingEscrow =
            <VotingEscrow>new Contract(votingEscrowAddress, patchAbiGasFields(VotingEscrowArtifact.abi), deployer);

        let filter = votingEscrow.filters.Deposit(null, null, null, null, null)

        let users: string[] = []
        try {
            users = JSON.parse(fs.readFileSync(storePath).toString());
        } catch (e) {}

        const blockLimits = BlockLimits.find(b => b.chain === chainName);
        if (blockLimits) {
            let blockNumber = blockLimits.start;

            while(blockNumber < blockLimits.end) {
                let events = await votingEscrow.queryFilter(filter, blockNumber, blockNumber + blockLimits.step);
                let newUsers = events.map(event => event.args.provider)
                for (let i = 0; i < newUsers.length; i++) {
                    let user = newUsers[i].toLowerCase()
                    if (!users.find(u => u === user)) {
                        users.push(user)
                    }
                }
                blockNumber += blockLimits.step
            }
        }

        console.log(`Found ${users.length} Locks`);

        fs.writeFileSync(storePath, JSON.stringify(users, null, 4));
    }
}